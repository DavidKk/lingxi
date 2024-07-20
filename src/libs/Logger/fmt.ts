export class Fmt {
  public availables(contents: TemplateStringsArray, availables: string[]) {
    const [content, ...rest] = contents
    return `${content}${availables.map((name) => `"<Bold:<Pascal:${name}>>"`).join(' ')}${rest.join(' ')}`
  }
}
