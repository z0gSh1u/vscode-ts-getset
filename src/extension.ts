// vscode-ts-getset
// by z0gSh1u @ 2020-12
// github.com/z0gSh1u/vscode-ts-getset

import * as vscode from 'vscode'
import * as ts from 'typescript'
import { generate as _generate } from './vscode-ts-getset'

/**
 * Generate getters and / or setters and insert them into the editor.
 */
function generate(mode: 'get' | 'set' | 'getset') {
  try {
    // get current editor
    let editor = vscode.window.activeTextEditor
    if (!editor) {
      // no editor is active, do nothing
      vscode.window.showErrorMessage('No editor is active now.')
      return
    }
    editor = editor as vscode.TextEditor

    // get content of current line
    const line = editor.document.lineAt(editor.selection.active.line).text
    if (line.length > 256) {
      // I guess this might be a 'minified' file. It's too long to find a proper class name.
      vscode.window.showErrorMessage(
        `Current line is too long. It doesn't look like class declaration.`
      )
      return
    }

    // find class name
    // TODO use AST instead of regex to get the class name
    const classNames = new RegExp(/class\s+(\w+)/).exec(line)
    if (!classNames || classNames.length == 0) {
      // no matched class name
      vscode.window.showErrorMessage(
        'No class name found. Try to put the cursor on first line of class declaration.'
      )
      return
    }
    const className = (classNames as RegExpMatchArray)[1] // capture group $1

    // build tsSource for generation
    const fileName = editor.document.fileName
    const fileContent = editor.document.getText()
    const tsSource = ts.createSourceFile(fileName, fileContent, ts.ScriptTarget.Latest)

    // generate getters and setters
    const { content, lastLine } = _generate(tsSource, className, mode)

    // find preceding whitespace to make a better alignment
    // this regex is a must-match one, so assert it
    const preWhitespace = new RegExp(/^(\s*)/).exec(editor.document.lineAt(lastLine).text)![1]
    const finalToInsert =
      '\n' +
      content
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(v => preWhitespace + v)
        .join('\n') +
      '\n'

    // insert into source code
    const workspaceEdit = new vscode.WorkspaceEdit()
    workspaceEdit.set(editor.document.uri, [
      vscode.TextEdit.insert(new vscode.Position(lastLine + 2, 0), finalToInsert), // TODO character
    ])
    vscode.workspace.applyEdit(workspaceEdit).then(
      () => {},
      err => vscode.window.showErrorMessage(err.message)
    )

    // done
    vscode.window.showInformationMessage('Generation finished successfully.')
  } catch (err) {
    vscode.window.showErrorMessage(err.message)
  }
}

export function activate(context: vscode.ExtensionContext) {
  // prepare 3 commands
  const generateGetCommand = vscode.commands.registerCommand(
    'vscode-ts-getset.generateGet',
    () => {
      generate('get')
    }
  )
  const generateSetCommand = vscode.commands.registerCommand(
    'vscode-ts-getset.generateSet',
    () => {
      generate('set')
    }
  )
  const generateGetSetCommand = vscode.commands.registerCommand(
    'vscode-ts-getset.generateGetSet',
    () => {
      generate('getset')
    }
  )

  // register them
  context.subscriptions.push(generateGetCommand)
  context.subscriptions.push(generateSetCommand)
  context.subscriptions.push(generateGetSetCommand)
}

export function deactivate() {}
