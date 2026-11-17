import { Heading, Text } from 'thriftyui/typography'

export function NotFound() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <Heading level={1}>Not found</Heading>
      <Text quiet className="mt-3">
        There is no page at this address.
      </Text>
    </div>
  )
}
