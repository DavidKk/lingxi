import type { ConfigurableConstructor } from '@/core/utils/withConfigurable'
import { withConfigurable } from '@/core/utils/withConfigurable'

describe('withConfigurable', () => {
  let BaseClass: ConfigurableConstructor<any>
  let ConfigurableClass: any
  beforeEach(() => {
    // 基础类
    BaseClass = class {}
    // 使用 withConfigurable 创建一个新的类
    ConfigurableClass = withConfigurable<{ setting: string }, typeof BaseClass>(BaseClass)
  })

  it('should initialize globalConfiguration to undefined', () => {
    expect((ConfigurableClass as any).globalConfiguration).toBeUndefined()
  })

  it('should configure globalConfiguration', () => {
    ConfigurableClass.configure({ setting: 'value' })
    expect((ConfigurableClass as any).globalConfiguration).toEqual({ setting: 'value' })
  })

  it('should get the configured globalConfiguration', () => {
    ConfigurableClass.configure({ setting: 'value' })
    expect(ConfigurableClass.getConfig()).toEqual({ setting: 'value' })
  })

  it('should throw an error if getConfig is called before configuration', () => {
    expect(() => ConfigurableClass.getConfig()).toThrow('it is not configured')
  })

  it('should affect subclasses with the same configuration', () => {
    class SubClass extends ConfigurableClass {}
    ConfigurableClass.configure({ setting: 'subclass' })
    expect(SubClass.getConfig()).toEqual({ setting: 'subclass' })
  })
})
