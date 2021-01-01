import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { generate } from '../src/vscode-ts-getset'

describe('all', () => {
  test('all', () => {
    const fileName = path.join(__dirname, './test._ts')
    const fileContent = fs.readFileSync(fileName).toString()
    const source = ts.createSourceFile(fileName, fileContent, ts.ScriptTarget.Latest)
    const content = generate(source, 'Person', 'getset').content
    expect(content).toBe(
      `
get name() {
  return this._name
}

set name(val: string) {
  this._name = val
}

get sex() {
  return this._sex
}

set sex(val: number) {
  this._sex = val
}
      `.trim()
    )
  })
})
