import { trimCommands } from '@/core/utils/trimCommands'

describe('trimCommands', () => {
  it('should trim a single command at the beginning', () => {
    expect(trimCommands('!help me', '!help')).toBe('me')
  })

  it('should trim a single command at the beginning with a space', () => {
    expect(trimCommands('!help me', '!help ')).toBe('me')
  })

  it('should trim multiple commands at the beginning', () => {
    expect(trimCommands('!help me', '!help', '!assist')).toBe('me')
  })

  it('should trim the first matching command', () => {
    expect(trimCommands('!help me', '!help', 'me')).toBe('')
  })

  it('should not trim if no command matches', () => {
    expect(trimCommands('hello world', '!help', '!hello')).toBe('hello world')
  })

  it('should trim only the leading space after the command', () => {
    expect(trimCommands('!help  me', '!help')).toBe('me')
  })

  it('should handle multiple spaces after the command', () => {
    expect(trimCommands('!help   me', '!help')).toBe('me')
  })

  it('should handle commands with different lengths', () => {
    expect(trimCommands('!longcommand me', '!longcommand', '!short')).toBe('me')
  })

  it('should handle empty message', () => {
    expect(trimCommands('', '!help')).toBe('')
  })

  it('should handle empty commands array', () => {
    expect(trimCommands('!help me')).toBe('!help me')
  })

  it('should handle multiple commands with overlapping prefixes', () => {
    expect(trimCommands('!helpme', '!help', '!helpme')).toBe('')
  })
})
