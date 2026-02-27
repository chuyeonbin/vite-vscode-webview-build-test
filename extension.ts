/// <reference types="node" />
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('react-webview.start', () => {
      ReactPanel.createOrShow(context)
    }),
  )
}

/**
 * Manages react webview panels
 */
class ReactPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ReactPanel | undefined

  private static readonly viewType = 'react'

  private readonly _panel: vscode.WebviewPanel
  private readonly _context: vscode.ExtensionContext
  private _disposables: vscode.Disposable[] = []

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    if (ReactPanel.currentPanel) {
      ReactPanel.currentPanel._panel.reveal(column)
    } else {
      ReactPanel.currentPanel = new ReactPanel(
        context,
        column || vscode.ViewColumn.One,
      )
    }
  }

  private constructor(context: vscode.ExtensionContext, column: vscode.ViewColumn) {
    this._context = context

    // Create and show a new webview panel
    this._panel = vscode.window.createWebviewPanel(
      ReactPanel.viewType,
      'React',
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._context.extensionUri, 'dist'),
        ],
      },
    )

    // Set the webview's initial html content
    this._panel.webview.html = this._getHtmlForWebview()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text)
            return
        }
      },
      null,
      this._disposables,
    )
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: 'refactor' })
  }

  public dispose() {
    ReactPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _getHtmlForWebview(): string {
    const distPath = path.join(this._context.extensionPath, 'dist')
    const indexPath = path.join(distPath, 'index.html')
    let html: string
    try {
      html = fs.readFileSync(indexPath, 'utf-8')
    } catch {
      return `<!DOCTYPE html><html><body><p>React 앱을 불러올 수 없습니다. 먼저 <code>pnpm run build</code>로 빌드하세요.</p></body></html>`
    }

    const webview = this._panel.webview

    // dist/index.html에서 스크립트·스타일 경로 추출 (Vite 빌드 결과)
    const scriptMatch = html.match(/<script[^>]+src="([^"]+)"[^>]*>/i)
    const styleMatches = html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/gi)

    const scriptSrc = scriptMatch?.[1]
    const styleHrefs = [...styleMatches].map((m) => m[1])

    const scriptUri = scriptSrc
      ? webview.asWebviewUri(
          vscode.Uri.file(path.join(distPath, scriptSrc.replace(/^\//, ''))),
        )
      : null
    const styleUris = styleHrefs.map((href) =>
      webview.asWebviewUri(
        vscode.Uri.file(path.join(distPath, href.replace(/^\//, ''))),
      ),
    )

    const nonce = getNonce()

    const styleTags = styleUris
      .map((uri) => `<link rel="stylesheet" href="${uri}" />`)
      .join('\n')

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} https: data:;" />
  <title>React Webview</title>
  ${styleTags}
</head>
<body>
  <div id="root"></div>
  ${scriptUri ? `<script nonce="${nonce}" type="module" src="${scriptUri}"></script>` : ''}
</body>
</html>`
  }
}

function getNonce() {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
