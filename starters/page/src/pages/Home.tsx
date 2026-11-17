import { Heading, Text } from 'thriftyui/typography'

export function Home() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <Heading level={1}>Home</Heading>
      <Text quiet className="mt-3">
        The home page.
      </Text>
    </div>
  )
}
