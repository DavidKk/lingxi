import { expectType } from 'tsd-lite'
import type { StringKeys, TrimPromise, Join, Paths, SplitPaths, Get, Satisfies } from '@/core/types/utils'

describe('StringKeys', () => {
  type TestStringKeys = { name: string; age: number; [Symbol.iterator]: () => Iterator<string> }

  expectType<StringKeys<'name'>>('name')
  expectType<StringKeys<keyof TestStringKeys>>('name' as 'name' | 'age')
})

describe('TrimPromise', () => {
  expectType<TrimPromise<Promise<number>>>(0 as number)
  expectType<TrimPromise<string>>('' as string)
})

describe('Join', () => {
  expectType<Join<'name', 'age'>>('name.age')
  expectType<Join<'user', 'details', '/'>>('user/details')
})

describe('Paths', () => {
  type TestPaths = { user: { id: number; profile: { name: string } } }
  expectType<Paths<TestPaths>>('user' as 'user' | 'user.id' | 'user.profile' | 'user.profile.name')
})

describe('SplitPaths', () => {
  expectType<SplitPaths<'user.id.profile.name'>>('user' as 'user' | 'id' | 'profile')
})

describe('Get', () => {
  type TestGet = { user: { id: number; profile: { name: string } } }

  expectType<Get<TestGet, 'user.id'>>(0 as number)
  expectType<Get<TestGet, 'user.profile.name'>>('' as string)
})

describe('Satisfies', () => {
  expectType<Satisfies<{ name: string }, { name: string; age: number }>>({} as { name: string; age: number })
  expectType<Satisfies<{ id: number }, { id: number; name: string }>>({} as { id: number; name: string })
})
