// Playfull: the original Budj look (cards and XXL figures on plain backgrounds).
import type { StyleModule } from '../styleModule'
import { TabBar } from '../../components/TabBar'
import { MyBudget } from '../../screens/MyBudget'
import { CategoryDetail } from '../../screens/CategoryDetail'
import { FixedExpenses } from '../../screens/FixedExpenses'
import { History } from '../../screens/History'
import { Evolution } from '../../screens/Evolution'
import { Settings } from './screens/Settings'
import { Onboarding } from './screens/Onboarding'
import { Budget } from './screens/Budget'
import { ManageCategories } from './screens/ManageCategories'
import { Profile } from './screens/Profile'

const playfull: StyleModule = {
  screens: {
    TabBar,
    MyBudget,
    CategoryDetail,
    FixedExpenses,
    History,
    Evolution,
    Settings,
    Onboarding,
    Budget,
    ManageCategories,
    Profile
  }
}

export default playfull
