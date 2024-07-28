/** 删除指令文本 */
export function trimCommands(message: string, ...commands: string[]) {
  const sortedCommands = commands.sort((a, b) => b.length - a.length)
  for (const command of sortedCommands) {
    if (message.startsWith(command)) {
      message = message.substring(command.length).trim()
    }
  }

  return message
}
