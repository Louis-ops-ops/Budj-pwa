import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { InvalidImportError, platform } from './storage'

/** Called straight from the click: iOS refuses the share sheet after an async wait. */
export async function exportBackup(): Promise<boolean> {
  const { toast } = useUi.getState()
  try {
    const { ok } = await platform.exportData(useBudj.getState().data)
    if (ok) toast('Sauvegarde exportée')
    return ok
  } catch {
    toast('Export impossible')
    return false
  }
}

/** Picks a file, validates it, then replaces the data once confirmed. */
export async function importBackup({ confirm = true } = {}): Promise<void> {
  const { openDialog, toast } = useUi.getState()
  try {
    const data = await platform.importData()
    if (!data) return
    const replace = (): void => {
      useBudj.getState().replaceData(data)
      toast('Données importées')
    }
    if (!confirm) {
      replace()
      return
    }
    openDialog({
      kind: 'confirm',
      title: 'Importer cette sauvegarde ?',
      message: 'Cela remplacera toutes tes données actuelles.',
      confirmLabel: 'Remplacer mes données',
      onConfirm: replace
    })
  } catch (error) {
    toast(
      error instanceof InvalidImportError
        ? 'Ce fichier n’est pas une sauvegarde Budj valide'
        : 'Import impossible'
    )
  }
}
