import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { InvalidImportError, platform } from './storage'

/** Lets the user pick a backup file and replaces the data with it. */
export async function importBackup(): Promise<void> {
  const { toast } = useUi.getState()
  try {
    const data = await platform.importData()
    if (!data) return
    useBudj.getState().replaceData(data)
    toast('Données importées')
  } catch (error) {
    toast(
      error instanceof InvalidImportError
        ? 'Ce fichier n’est pas une sauvegarde Budj valide'
        : 'Import impossible'
    )
  }
}
