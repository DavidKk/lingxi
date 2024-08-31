import { adjustIndentSpaces } from '@/core/utils/adjustIndentSpaces'

describe('adjustIndentSpaces', () => {
  it('should convert 4 spaces indent to 2 spaces', () => {
    const code = `
    function test() {
        return true;
    }
`
    const expected = `
  function test() {
    return true;
  }
`
    expect(adjustIndentSpaces(code, 2)).toBe(expected)
  })

  it('should keep the same indent if indents match', () => {
    const code = `
  function test() {
    return true;
  }
`
    expect(adjustIndentSpaces(code, 2)).toBe(code)
  })

  it('should convert 4 spaces indent to 1 space', () => {
    const code = `
function test() {
    return true;
}    
`
    const expected = `
function test() {
 return true;
}
`
    expect(adjustIndentSpaces(code, 1)).toBe(expected)
  })

  it('should not change if there are no leading spaces', () => {
    const code = `
function test() {
  return true;
}
`
    expect(adjustIndentSpaces(code, 2)).toBe(code)
  })

  it('should handle empty strings correctly', () => {
    const code = ``
    expect(adjustIndentSpaces(code, 2)).toBe(code)
  })

  it('should adjust indentation of a graph structure', () => {
    const graphCode = `
graph LR
    subgraph 准备
        A[准备数据] --> B[清理数据]
    end
    subgraph 建模
        C[选择模型] --> D[训练模型] --> E[评估模型]
    end
    subgraph 部署
        F[部署模型] --> G[监控模型]
    end
    A --> C
    E --> F
`

    const expectedAdjustedCode = `
graph LR
  subgraph 准备
    A[准备数据] --> B[清理数据]
  end
  subgraph 建模
    C[选择模型] --> D[训练模型] --> E[评估模型]
  end
  subgraph 部署
    F[部署模型] --> G[监控模型]
  end
  A --> C
  E --> F
`

    const adjustedCode = adjustIndentSpaces(graphCode, 2)
    expect(adjustedCode).toBe(expectedAdjustedCode)
  })
})
