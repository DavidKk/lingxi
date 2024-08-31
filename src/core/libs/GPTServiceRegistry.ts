import { CoreServiceAbstract } from './CoreServiceAbstract'
import { GPTAbstract } from './GPTAbstract'

export class GPTServiceRegistry<G extends GPTAbstract> extends CoreServiceAbstract {
  protected _gptServices: G[] = []
  protected _activeGPTName: string

  /** 获取当前激活的 GPT 名称 */
  public get activeGPT() {
    if (this._activeGPTName && this._gptServices.some((gpt) => gpt.name === this._activeGPTName)) {
      return this._activeGPTName
    }

    return this._gptServices[0].name
  }

  /** GPT 服务个数 */
  public get gptServiceCount() {
    return this._gptServices.length || 0
  }

  /** 列出 GPT 服务名称 */
  public listGpts() {
    return this._gptServices.map((gpt) => gpt.name)
  }

  /** 根据名称获取 GPT 服务 */
  public getGPTService(name = this.activeGPT) {
    return this._gptServices.find((gpt) => gpt.name === name)
  }

  /** 设置激活的 GPT 服务 */
  public setActiveGPT(name: string) {
    if (this._gptServices.some((gpt) => gpt.name === name)) {
      this._activeGPTName = name
      return true
    }

    return false
  }

  /** 注册GPT服务 */
  public registerGPT(...services: G[]) {
    for (const gptService of services) {
      if (!(gptService instanceof GPTAbstract)) {
        return
      }

      if (!gptService.name) {
        return
      }

      this._gptServices.push(gptService)
    }
  }
}
