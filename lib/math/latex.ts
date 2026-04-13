const SIMPLE_SYMBOL_MAP: Record<string, string> = {
  '\\times': ' times ',
  '\\cdot': ' times ',
  '\\div': ' divided by ',
  '\\pi': ' pi ',
  '\\theta': ' theta ',
  '\\alpha': ' alpha ',
  '\\beta': ' beta ',
  '\\gamma': ' gamma ',
  '\\delta': ' delta ',
  '\\lambda': ' lambda ',
  '\\mu': ' mu ',
  '\\sigma': ' sigma ',
  '\\phi': ' phi ',
  '\\omega': ' omega ',
  '\\pm': ' plus or minus ',
  '\\mp': ' minus or plus ',
  '\\neq': ' not equal to ',
  '\\approx': ' approximately equal to ',
  '\\sim': ' is similar to ',
  '\\ge': ' greater than or equal to ',
  '\\le': ' less than or equal to ',
  '\\infty': ' infinity ',
  '\\degree': ' degrees ',
  '\\to': ' goes to ',
  '\\rightarrow': ' goes to ',
  '\\leftarrow': ' goes to the left ',
  '\\leftrightarrow': ' goes both ways ',
  '\\implies': ' implies ',
  '\\cup': ' union ',
  '\\cap': ' intersection ',
  '\\in': ' is in ',
  '\\notin': ' is not in ',
  '\\subset': ' is a subset of ',
  '\\subseteq': ' is a subset of or equal to ',
  '\\superset': ' is a superset of ',
  '\\superseteq': ' is a superset of or equal to ',
  '\\emptyset': ' empty set ',
  '\\forall': ' for all ',
  '\\exists': ' there exists ',
  '\\therefore': ' therefore ',
  '\\because': ' because ',
  '\\angle': ' angle ',
  '\\triangle': ' triangle ',
  '\\parallel': ' parallel to ',
  '\\perp': ' perpendicular to ',
  '\\sin': ' sine ',
  '\\cos': ' cosine ',
  '\\tan': ' tangent ',
  '\\csc': ' cosecant ',
  '\\sec': ' secant ',
  '\\cot': ' cotangent ',
  '\\log': ' log ',
  '\\ln': ' natural log ',
  '\\left': ' ',
  '\\right': ' ',
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function findMatchingBrace(input: string, startIndex: number) {
  let depth = 0

  for (let index = startIndex; index < input.length; index += 1) {
    const character = input[index]
    if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function readLatexArgument(input: string, startIndex: number) {
  if (startIndex >= input.length) {
    return { value: '', nextIndex: startIndex }
  }

  if (input[startIndex] === '{') {
    const endIndex = findMatchingBrace(input, startIndex)
    if (endIndex === -1) {
      return { value: input.slice(startIndex + 1), nextIndex: input.length }
    }

    return {
      value: input.slice(startIndex + 1, endIndex),
      nextIndex: endIndex + 1,
    }
  }

  return {
    value: input[startIndex],
    nextIndex: startIndex + 1,
  }
}

function latexExpressionToPlainText(expression: string): string {
  let output = ''
  let index = 0

  while (index < expression.length) {
    const remaining = expression.slice(index)

    if (
      remaining.startsWith('\\frac') ||
      remaining.startsWith('\\tfrac') ||
      remaining.startsWith('\\dfrac')
    ) {
      const commandLength = remaining.startsWith('\\frac') ? 5 : 6
      const numerator = readLatexArgument(expression, index + commandLength)
      const denominator = readLatexArgument(expression, numerator.nextIndex)
      output += `${latexExpressionToPlainText(numerator.value)} over ${latexExpressionToPlainText(denominator.value)}`
      index = denominator.nextIndex
      continue
    }

    if (remaining.startsWith('\\sqrt')) {
      let nextIndex = index + 5
      let degree = ''

      if (expression[nextIndex] === '[') {
        const degreeEndIndex = expression.indexOf(']', nextIndex)
        if (degreeEndIndex !== -1) {
          degree = expression.slice(nextIndex + 1, degreeEndIndex)
          nextIndex = degreeEndIndex + 1
        }
      }

      const radicand = readLatexArgument(expression, nextIndex)
      output += degree
        ? `${latexExpressionToPlainText(degree)} root of ${latexExpressionToPlainText(radicand.value)}`
        : `square root of ${latexExpressionToPlainText(radicand.value)}`
      index = radicand.nextIndex
      continue
    }

    const mappedSymbol = Object.entries(SIMPLE_SYMBOL_MAP).find(([token]) => remaining.startsWith(token))
    if (mappedSymbol) {
      output += mappedSymbol[1]
      index += mappedSymbol[0].length
      continue
    }

    const character = expression[index]

    if (character === '^') {
      const exponent = readLatexArgument(expression, index + 1)
      output += ` to the power of ${latexExpressionToPlainText(exponent.value)}`
      index = exponent.nextIndex
      continue
    }

    if (character === '_') {
      const subscript = readLatexArgument(expression, index + 1)
      output += ` sub ${latexExpressionToPlainText(subscript.value)}`
      index = subscript.nextIndex
      continue
    }

    if (character === '{' || character === '}') {
      index += 1
      continue
    }

    if (character === '\\') {
      const commandMatch = expression.slice(index + 1).match(/^[a-zA-Z]+/)
      if (commandMatch) {
        output += `${commandMatch[0]} `
        index += commandMatch[0].length + 1
        continue
      }
    }

    output += character
    index += 1
  }

  return normalizeWhitespace(output)
}

export function replaceLatexWithPlainText(text: string) {
  const withEscapedBlockMath = text.replace(/\\\[([\s\S]+?)\\\]/g, (_match, expression: string) =>
    latexExpressionToPlainText(expression)
  )

  const withEscapedInlineMath = withEscapedBlockMath.replace(
    /\\\(([\s\S]+?)\\\)/g,
    (_match, expression: string) => latexExpressionToPlainText(expression)
  )

  const withBlockMath = withEscapedInlineMath.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_match, expression: string) => latexExpressionToPlainText(expression)
  )

  const withInlineMath = withBlockMath.replace(/\$([^$\n]+?)\$/g, (_match, expression: string) =>
    latexExpressionToPlainText(expression)
  )

  return normalizeWhitespace(withInlineMath)
}
