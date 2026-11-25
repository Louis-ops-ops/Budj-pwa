// Pro: hero gradients, grouped lists, avatar in the top bar (v3 §3.3).
// Screens not drawn yet fall back on Playfull (StyledScreen).
import type { StyleModule } from '../styleModule'
import { ProTabBar } from './components/ProTabBar'
import { MyBudget } from './screens/MyBudget'
import { Onboarding } from './screens/Onboarding'
import { History } from './screens/History'
import { Evolution } from './screens/Evolution'
import { FixedExpenses } from './screens/FixedExpenses'
import { CategoryDetail } from './screens/CategoryDetail'
import { Budget, ManageCategories, Profile, Settings } from './screens/Simple'

const pro: StyleModule = {
  screens: {
    TabBar: ProTabBar,
    MyBudget,
    Budget,
    ManageCategories,
    Profile,
    Settings,
    Onboarding,
    History,
    Evolution,
    FixedExpenses,
    CategoryDetail
  }
}

export default pro
