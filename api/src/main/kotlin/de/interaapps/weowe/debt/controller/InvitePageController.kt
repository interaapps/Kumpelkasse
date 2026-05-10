package de.interaapps.weowe.debt.controller

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.util.HtmlUtils
import org.springframework.web.util.UriUtils
import java.nio.charset.StandardCharsets

@RestController
class InvitePageController(
    @Value("\${app.public-base-url:https://kumpelkasse.interaapps.de}")
    private val publicBaseUrl: String = "https://kumpelkasse.interaapps.de",
) {
    @GetMapping("/invite/{groupId}", produces = [MediaType.TEXT_HTML_VALUE])
    @ResponseBody
    fun invitePage(@PathVariable groupId: String): String {
        val escapedGroupId = HtmlUtils.htmlEscape(groupId)
        val encodedGroupId = UriUtils.encodePathSegment(groupId, StandardCharsets.UTF_8)
        val inviteUrl = "${publicBaseUrl.trimEnd('/')}/invite/$encodedGroupId"
        val appUrl = "kumpelkasse://invite/$encodedGroupId"

        return """
            <!doctype html>
            <html lang="de">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <title>Kumpelkasse Einladung</title>
                <style>
                  :root {
                    color-scheme: light dark;
                    --bg: #f5f7fb;
                    --card: #ffffff;
                    --text: #111827;
                    --muted: #6b7280;
                    --accent: #208aef;
                  }
                  @media (prefers-color-scheme: dark) {
                    :root {
                      --bg: #0f172a;
                      --card: #111827;
                      --text: #f8fafc;
                      --muted: #94a3b8;
                      --accent: #60a5fa;
                    }
                  }
                  body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--bg) 70%, var(--accent) 30%));
                    color: var(--text);
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
                  }
                  .card {
                    width: min(100%, 460px);
                    background: var(--card);
                    border-radius: 28px;
                    padding: 24px;
                    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.14);
                  }
                  h1 {
                    margin: 0 0 8px;
                    font-size: 30px;
                    line-height: 1.05;
                  }
                  p {
                    margin: 0;
                    color: var(--muted);
                    line-height: 1.55;
                  }
                  .stack {
                    display: grid;
                    gap: 14px;
                    margin-top: 22px;
                  }
                  .button {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                    border: 0;
                    border-radius: 999px;
                    padding: 16px 18px;
                    text-align: center;
                    font-weight: 800;
                    text-decoration: none;
                  }
                  .primary {
                    background: var(--accent);
                    color: white;
                  }
                  .secondary {
                    background: color-mix(in srgb, var(--accent) 12%, var(--card) 88%);
                    color: var(--text);
                  }
                  .code {
                    margin-top: 18px;
                    padding: 14px 16px;
                    border-radius: 18px;
                    background: color-mix(in srgb, var(--accent) 8%, var(--card) 92%);
                    color: var(--muted);
                    font-size: 13px;
                    word-break: break-all;
                  }
                </style>
              </head>
              <body>
                <main class="card">
                  <h1>Zur Gruppe beitreten</h1>
                  <p>Wenn Kumpelkasse installiert ist, kannst du die Einladung direkt in der App oeffnen. Falls nicht, kopiere oder teile den Link weiter.</p>
                  <div class="stack">
                    <a class="button primary" href="$appUrl">In Kumpelkasse oeffnen</a>
                    <a class="button secondary" href="$inviteUrl">Link im Browser neu laden</a>
                  </div>
                  <div class="code">Einladungs-ID: $escapedGroupId</div>
                </main>
              </body>
            </html>
        """.trimIndent()
    }
}
