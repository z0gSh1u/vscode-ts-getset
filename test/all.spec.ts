import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { generate } from '../src/vscode-ts-getset'

describe('all', () => {
  test('all', () => {
    const fileName = path.join(__dirname, './test._ts')
    const fileContent = fs.readFileSync(fileName).toString()
    const source = ts.createSourceFile(fileName, fileContent, ts.ScriptTarget.Latest)
    const content = generate(source, 'Foo', 'getset').content
    expect(content).toBe(
      `
get bar1() {
  return this._bar1
}

set bar1(val: string) {
  this._bar1 = val
}

get bar2() {
  return this._bar2
}

set bar2(val: number) {
  this._bar2 = val
}
      `.trim()
    )
  })
})
