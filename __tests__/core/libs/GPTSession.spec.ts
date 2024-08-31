import { GPTSession, type GPTSessionOptions } from '@/core/libs/GPTSession'

describe('GPTSession', () => {
  const ssid = 'test-ssid'

  it('should create a GPTSession instance with default settings', () => {
    const session = new GPTSession(ssid)

    expect(session).toBeInstanceOf(GPTSession)
    expect(session.systemSettings).toEqual({})
    expect(session['ssid']).toBe(ssid)
  })

  it('should create a GPTSession instance with provided settings', () => {
    const options: GPTSessionOptions = {
      systemSettings: { instructions: 'Follow the guidelines' },
    }
    const session = new GPTSession(ssid, options)

    expect(session.systemSettings).toEqual({ instructions: 'Follow the guidelines' })
  })

  it('should update systemSettings using setter', () => {
    const session = new GPTSession(ssid)
    session.systemSettings = { instructions: 'New instructions' }

    expect(session.systemSettings.instructions).toBe('New instructions')
  })

  it('should clone a GPTSession instance with the same ssid and systemSettings', () => {
    const options: GPTSessionOptions = {
      systemSettings: { instructions: 'Clone this session' },
    }
    const session = new GPTSession(ssid, options)
    const clonedSession = session.clone()

    expect(clonedSession).toBeInstanceOf(GPTSession)
    expect(clonedSession['ssid']).toBe(ssid)
    expect(clonedSession.systemSettings).toEqual({ instructions: 'Clone this session' })
    expect(clonedSession).not.toBe(session)
  })
})
