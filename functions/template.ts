export function getTemplate({
  redirectPath,
  withError
}: {
  redirectPath: string;
  withError: boolean;
}): string {
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <title>Luce — family only</title>
      <meta name="description" content="Private Luce preview for Naomi. Enter the family password.">
      <style>
        :root {
          color-scheme: light;
          --bg: #f5f0e8;
          --ink: #3d3429;
          --soft: #6b5e4f;
          --card: #fffdf8;
          --accent: #7a9a7a;
          --danger: #a33;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
          background: var(--bg);
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        article {
          width: min(100%, 28rem);
          background: var(--card);
          border-radius: 1.25rem;
          padding: 1.75rem 1.5rem;
          box-shadow: 0 8px 28px rgba(61, 52, 41, 0.08);
        }
        h1 {
          margin: 0 0 0.35rem;
          font-size: 1.75rem;
          font-weight: 700;
        }
        p {
          margin: 0 0 1.25rem;
          color: var(--soft);
          font-size: 1.05rem;
          line-height: 1.4;
        }
        .error {
          background: #fdeaea;
          color: var(--danger);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.4rem;
          font-size: 1.05rem;
        }
        input[type="password"] {
          width: 100%;
          font-size: 1.25rem;
          padding: 0.9rem 1rem;
          border: 2px solid #d9d0c3;
          border-radius: 0.85rem;
          margin-bottom: 1rem;
          background: #fff;
          color: var(--ink);
        }
        input[type="password"]:focus {
          outline: 3px solid rgba(122, 154, 122, 0.45);
          border-color: var(--accent);
        }
        button {
          width: 100%;
          font-size: 1.2rem;
          font-weight: 700;
          padding: 0.95rem 1rem;
          border: 0;
          border-radius: 0.85rem;
          background: var(--accent);
          color: #fff;
          cursor: pointer;
        }
        button:active { transform: scale(0.98); }
        .hint {
          margin-top: 1rem;
          margin-bottom: 0;
          font-size: 0.95rem;
        }
      </style>
    </head>
    <body>
      <article>
        <h1>Luce</h1>
        <p>Private preview for Naomi. Parents enter the family password.</p>
        ${withError ? `<p class="error" role="alert">Incorrect password. Try again.</p>` : ''}
        <form method="post" action="/cfp_login">
          <input type="hidden" name="redirect" value="${redirectPath}" />
          <label for="password">Password</label>
          <input id="password" type="password" name="password" placeholder="Family password" aria-label="Password" autocomplete="current-password" required autofocus>
          <button type="submit">Open Luce</button>
        </form>
        <p class="hint">Stay signed in on this iPad for about a week.</p>
      </article>
    </body>
  </html>
  `;
}
