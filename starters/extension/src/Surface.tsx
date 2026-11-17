import { Layout, Page, PageContent, PageFooter, PageHeader } from 'thriftyui/page'
import { useSystemDark } from './use-system-dark'
import { Heading, Text } from 'thriftyui/typography'

// The extension's one page, the same in the toolbar's popup and in the
// side panel: a header with its name, an empty content, a footer -- blank,
// for the extension to fill.

export function Surface({ where }: { where: 'popup' | 'sidepanel' }) {
  useSystemDark()
  return (
    <Layout className="h-full">
      <Page>
        <PageHeader>
          <Heading level={1} size={6} className="self-center px-4">
            Extension
          </Heading>
        </PageHeader>
        <PageContent>
          <Text size="sm" quiet className="px-4 py-6">
            Your extension starts here.
          </Text>
        </PageContent>
        <PageFooter>
          <span className="self-center px-4 text-xs text-neutral-11">{where === 'popup' ? 'Popup' : 'Side panel'}</span>
        </PageFooter>
      </Page>
    </Layout>
  )
}
