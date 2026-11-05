import { SettingsContent } from '../components/SettingsContent'
import { Text } from '../components/Text'
import { MobilePage } from '../layout/Page'

/** Réglages tab of the mobile navigation. */
export function Settings(): React.JSX.Element {
  return (
    <MobilePage>
      <Text variant="h1" as="h1">
        Réglages
      </Text>
      <SettingsContent />
    </MobilePage>
  )
}
