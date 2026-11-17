import { Heading, Text } from 'thriftyui/typography'

export function About() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <Heading level={1}>About</Heading>
      <Text quiet className="mt-3">
        What this app is.
      </Text>
    </div>
  )
}
