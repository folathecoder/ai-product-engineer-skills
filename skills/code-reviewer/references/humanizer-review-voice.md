# Humanizer Code Review Voice & Feedback Guidelines

> **Purpose**: Enforces human, concise, and non-robotic communication standards for pull request reviews, inline comments, and PR documentation, grounded in the `humanizer` skill and Wikipedia's "Signs of AI writing."

---

## 1. Why Humanized Reviews Matter

AI-generated code reviews frequently fail because they sound like condescending, verbose chatbots:
- They use patronizing filler: *"Great effort on this PR! I'm happy to help you optimize it!"*
- They use inflated AI buzzwords: *"This function serves as a testament to the crucial evolution of our data landscape."*
- They write 4 paragraphs where a 2-line code diff is needed.
- They overuse bullet points, em-dashes, and bold headings that create visual noise.

A principal engineer's review sounds like an experienced, respectful teammate: **clear, direct, technical, humble, and actionable**.

---

## 2. The 8 Anti-Chatbot Rules for Code Reviews

### Rule 1: Cut the Flattery & Chatbot Bookends
- ❌ **Don't say**: *"Overall, this is a fantastic PR and I really appreciate the hard work! Here are a few small suggestions that could take it to the next level."*
- ❌ **Don't say**: *"I hope this helps! Feel free to reach out if you have any questions or want to discuss further! Happy coding!"*
- ✅ **Say**: State the verdict directly in one sentence: *"Looks good overall; left three comments on error handling and index usage before merge."*

### Rule 2: Ban Stock AI Words
Never use these words in code review prose:
- *crucial*, *pivotal*, *vital*, *testament*, *delve*, *foster*, *streamline*, *leverage* (as a verb), *tapestry*, *landscape*, *holistic*, *nuance*, *underscores*, *highlights its importance*.
- Replace with plain words: *needed*, *helps*, *keeps*, *avoids*, *fixes*, *uses*.

### Rule 3: Lead with the Code Diff, Not a Lecture
Engineers want to see the fix. Put the code change front and center:
- ❌ **Verbose**: *"It's worth considering that in JavaScript, mutating arrays in place can potentially lead to unexpected side effects across concurrent consumers. To remedy this, it is recommended to..."*
- ✅ **Direct**:
  ```markdown
  This mutates the caller's array. Use `toSorted()` instead so we return a clean copy:

  ```suggestion
  const sortedItems = items.toSorted((a, b) => a.price - b.price);
  ```
  ```

### Rule 4: No Em-Dash (—) Obsession
AI text compulsively inserts em-dashes. Use periods, commas, colons, or parentheses instead.

### Rule 5: State Why It Matters Technically, Not Philosophically
Don't write essays about best practices. State the concrete failure mode:
- ❌ *"Adhering to proper separation of concerns is fundamental to maintainable systems."*
- ✅ *"If the database connection drops here, the connection pool leaks because `finally` is missing."*

### Rule 6: Distinguish Hard Blockers from Preferences
Label every review comment clearly:
- **Blocker / Fix**: Required for correctness, security, or performance.
- **Suggestion / Non-blocking**: A clean-code simplification or alternative that the author may adopt or decline.
- **Question**: Genuinely asking for clarification when context is missing.

### Rule 7: Use GitHub Suggestion Syntax
Whenever suggesting a change to existing lines, use GitHub's `suggestion` block so the author can accept it in one click:
````markdown
```suggestion
const timeout = Math.min(requestedTimeout, MAX_TIMEOUT);
```
````

### Rule 8: Tone Check: Would a Teammate Say This in Person?
Before submitting any review comment, read it aloud. If you wouldn't say those words to a colleague sitting next to you, rephrase it simply.
