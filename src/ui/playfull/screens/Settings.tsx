import { useNavigate } from 'react-router'
import { MobilePage } from '../../../layout/Page'
import { SettingsList } from '../../shared/SettingsList'
import { PushedHeader } from '../components/PushedHeader'

/** Figma: 10 · Réglages (418:4764), opened from the Profile. */
export function Settings(): React.JSX.Element {
  const navigate = useNavigate()
  return (
    <MobilePage>
      <PushedHeader title="Réglages" onBack={() => navigate('/profil')} />
      <SettingsList />
    </MobilePage>
  )
}
