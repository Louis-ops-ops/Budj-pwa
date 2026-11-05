import { AddIcon } from './Add'
import { RemoveIcon } from './Remove'
import { ChevronIcon } from './Chevron'
import { CategoriesIcon } from './Categories'
import { CalendarIcon } from './Calendar'
import { HistoryIcon } from './History'
import { DeleteIcon } from './Delete'
import { EditIcon } from './Edit'
import { MoveIcon } from './Move'
import { ClockIcon } from './Clock'
import { TrendUpIcon } from './TrendUp'
import { TrendDownIcon } from './TrendDown'
import { ShareIcon } from './Share'
import { SettingsIcon } from './Settings'

export const icons = {
  add: AddIcon,
  remove: RemoveIcon,
  chevron: ChevronIcon,
  categories: CategoriesIcon,
  calendar: CalendarIcon,
  history: HistoryIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  move: MoveIcon,
  clock: ClockIcon,
  trendUp: TrendUpIcon,
  trendDown: TrendDownIcon,
  share: ShareIcon,
  settings: SettingsIcon
}

export type IconName = keyof typeof icons
