import { Logger } from '@/core/libs/Logger'
import { Context, createContext, createContextService } from '@/core/libs/Context'

describe('Context Class', () => {
  it('should instantiate with a given context and logger', () => {
    const mockLogger = new Logger({ traceId: false })
    const context = new Context({ traceId: '123', logger: mockLogger })

    expect(context['logger']).toBe(mockLogger)
    expect(context['context']).toHaveProperty('traceId', '123')
  })

  it('should create a new Logger if none is provided', () => {
    const context = new Context({ traceId: '123' })

    expect(context['logger']).toBeInstanceOf(Logger)
    expect(context['context']).toHaveProperty('traceId', '123')
  })

  it('should resolve a service only once and return the same instance', () => {
    const context = new Context({})
    const mockService = jest.fn(() => ({ name: 'testService' }))

    const service1 = context.resolveService('testService', mockService)
    const service2 = context.resolveService('testService', mockService)

    expect(service1).toBe(service2)
    expect(mockService).toHaveBeenCalledTimes(1)
  })
})

describe('createContext function', () => {
  it('should create a proxy context with provided properties', () => {
    const logger = new Logger({ traceId: true })
    const proxyContext = createContext({ traceId: '123', logger })

    expect(proxyContext.traceId).toBe('123')
    expect(proxyContext['logger']).toBe(logger)
    expect(proxyContext['resolveService']).toBeInstanceOf(Function)
  })

  it('should access Context properties from proxy', () => {
    const proxyContext = createContext({ traceId: '123' })

    expect(proxyContext['logger']).toBeInstanceOf(Logger)
    expect(proxyContext.resolveService).toBeInstanceOf(Function)
  })
})

describe('createContextService function', () => {
  it('should create a service that is unique to the context', () => {
    const context = new Context({})
    const createService = jest.fn(() => ({ name: 'uniqueService' }))
    const useService = createContextService(createService)

    const service1 = useService(context)
    const service2 = useService(context)

    expect(service1).toBe(service2)
    expect(createService).toHaveBeenCalledTimes(1)
  })

  it('should create different services for different contexts', () => {
    const context1 = new Context({})
    const context2 = new Context({})
    const createService = jest.fn(() => ({ name: 'uniqueService' }))
    const useService = createContextService(createService)

    const service1 = useService(context1)
    const service2 = useService(context2)

    expect(service1).not.toBe(service2)
    expect(createService).toHaveBeenCalledTimes(2)
  })
})
