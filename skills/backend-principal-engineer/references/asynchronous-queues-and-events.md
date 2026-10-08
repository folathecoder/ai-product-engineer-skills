# Asynchronous Queues & Event-Driven Architecture

> **Purpose**: Authoritative reference for message queues (BullMQ, RabbitMQ), event streams (Kafka), at-least-once delivery guarantees, idempotent consumers, and Dead Letter Queues (DLQ).

---

## 1. Task Queues vs. Event Streams

| Dimension | Task Queues (BullMQ / Celery) | Event Streams (Apache Kafka / Kinesis) |
|---|---|---|
| **Primary Model** | Message passing: Work item distributed to a single worker. | Partitioned log: Consumers read stream independently at their own offset. |
| **Message Lifetime** | Deleted upon successful acknowledgment. | Persisted immutably for retention duration (e.g. 7 days). |
| **Ordering** | FIFO within priority queues. | Strict ordering guaranteed **only within a single partition key**. |
| **Typical Use Case** | Send transactional email, transcode video, generate PDF. | Event sourcing, analytics pipelines, order lifecycle events. |

---

## 2. At-Least-Once Delivery & Idempotent Consumers

In distributed systems, network partitions make true "exactly-once" delivery impossible without end-to-end idempotency. **All consumers must assume messages will be delivered more than once.**

### Pattern: Idempotent Consumer via Database Deduplication
```ts
export async function processPaymentEvent(event: PaymentEvent) {
  return await db.$transaction(async (tx) => {
    // 1. Attempt to insert message ID into processed_events table
    const alreadyProcessed = await tx.processedEvents.findUnique({
      where: { eventId: event.id }
    })

    if (alreadyProcessed) {
      console.log(`[INFO] Event ${event.id} already processed. Skipping safely.`)
      return
    }

    // 2. Execute business mutation
    await tx.orders.update({
      where: { id: event.orderId },
      data: { status: 'PAID' }
    })

    // 3. Record completion in the same atomic transaction
    await tx.processedEvents.create({
      data: { eventId: event.id, processedAt: new Date() }
    })
  })
}
```

---

## 3. Dead Letter Queues (DLQ) & Poison Pill Mitigation

A **poison pill** is a malformed message that triggers an unhandled crash whenever processed. Without a DLQ, the worker retries infinitely, blocking the entire queue.

### Canonical Retry & DLQ Architecture
1. **Exponential Backoff with Full Jitter**:
   Never retry on a fixed interval (e.g. exactly every 5s); this creates synchronized thundering herds against failing downstream dependencies.
   ```ts
   // Backoff formula with random jitter
   const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt)) * (0.5 + Math.random() * 0.5)
   ```
2. **Move to DLQ on Max Retries**:
   After N failed attempts (e.g. 3–5 attempts), move the failed message and its full error stack to a Dead Letter Queue (`orders-dlq`).
3. **Alerting & Observability**:
   Trigger an automated alert (PagerDuty/Slack) when messages enter the DLQ for engineer inspection and manual replay.
