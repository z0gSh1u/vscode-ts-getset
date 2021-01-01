// vscode-ts-getset
// by z0gSh1u @ 2020-12
// github.com/z0gSh1u/vscode-ts-getset

import * as ts from 'typescript'

/**
 * Ensure `condition`, else throw `hint`.
 */
function assert(condition: unknown, hint: string) {
  if (!condition) {
    throw new Error(hint)
  }
}

/**
 * Generate getter and / or setter for specified class.
 */
export function generate(
  tsSource: ts.SourceFile,
  className: string,
  mode: 'get' | 'set' | 'getset' = 'getset'
) {
  // find corresponding class declaration
  const classDecls = tsSource.statements.filter(
    v =>
      v.kind == ts.SyntaxKind.ClassDeclaration &&
      (v as ts.ClassDeclaration)?.name?.text == className
  ) as ts.ClassDeclaration[]
  assert(classDecls.length == 1, `There are multiple or none class declarations of "${className}".`)
  const classDecl = classDecls[0]

  // find all property declarations of this class
  const allProperties = classDecl.members.filter(v => v.kind == ts.SyntaxKind.PropertyDeclaration)
  assert(allProperties.length > 0, 'No properties found.')

  // find last line of property declarations
  // generation product will be inserted there
  const lastLine = tsSource.getLineAndCharacterOfPosition(
    allProperties.sort((a, b) => b.end - a.end /* by end descending */)[0].pos
  ).line

  // find all private or protected properties of it
  const ableProperties = allProperties.filter(
    v =>
      v.kind == ts.SyntaxKind.PropertyDeclaration &&
      v.modifiers?.some(
        m => m.kind == ts.SyntaxKind.PrivateKeyword || m.kind == ts.SyntaxKind.ProtectedKeyword
      )
  ) as ts.PropertyDeclaration[]
  assert(ableProperties.length > 0, 'No private or protected properties found.')

  // collect information for getter and setter generation
  interface MyProperty {
    name: string
    type: string
  }
  const myProperties: MyProperty[] = ableProperties.map(v => {
    const name = (v.name as ts.Identifier).text
    assert(name.startsWith('_'), `Property "${name}" should start with an underscore.`)
    const type = v.type ? (v.type as ts.TypeNode).getText(tsSource) : 'any'
    return {
      name, // .substring(1) to remove first underscore
      type,
    }
  })
  myProperties.reverse()

  // generate getter and setter text
  let res = ''
  // prettier-ignore
  myProperties.forEach(v => {
    mode.includes('get') &&
      (res +=
`get ${v.name.substring(1)}() {
  return this.${v.name}
}`.trim() + '\n\n')
    mode.includes('set') &&
      (res +=
`set ${v.name.substring(1)}(val: ${v.type}) {
  this.${v.name} = val
}`.trim() + '\n\n')
  })

  return {
    content: res.trim(),
    lastLine,
  }
}
