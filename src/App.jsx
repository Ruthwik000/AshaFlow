import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import BottomNav from './components/BottomNav'

import Login from './pages/asha/Login'
import Home from './pages/asha/Home'
import Add from './pages/asha/Add'
import ScanForm from './pages/asha/ScanForm'
import NewSchema from './pages/asha/NewSchema'
import Assistant from './pages/asha/Assistant'
import Reminders from './pages/asha/Reminders'
import GovPortal from './pages/asha/GovPortal'
import Forms from './pages/asha/Forms'
import FormPick from './pages/asha/FormPick'
import FormFill from './pages/asha/FormFill'
import Submissions from './pages/asha/Submissions'
import NewHousehold from './pages/asha/NewHousehold'
import NewPerson from './pages/asha/NewPerson'
import OfficerForms from './pages/officer/Forms'
import Landing from './pages/public/Landing'
import Portals from './pages/public/Portals'
import Families from './pages/asha/Families'
import Family from './pages/asha/Family'
import VisitType from './pages/asha/VisitType'
import Consent from './pages/asha/Consent'
import AskOnce from './pages/asha/AskOnce'
import Review from './pages/asha/Review'
import Outputs from './pages/asha/Outputs'
import Earnings from './pages/asha/Earnings'
import SyncPage from './pages/asha/SyncPage'
import More from './pages/asha/More'
import Profile from './pages/asha/Profile'
import Diagnostics from './pages/asha/Diagnostics'
import Proof from './pages/asha/Proof'
import Paper from './pages/asha/Paper'

import OfficerDashboard from './pages/officer/Dashboard'
import AddProgramme from './pages/officer/AddProgramme'

import WomanHome from './pages/woman/Home'
import WomanRecords from './pages/woman/Records'
import WomanSchemes from './pages/woman/Schemes'
import WomanSchemeDetail from './pages/woman/SchemeDetail'
import WomanAsk from './pages/woman/Ask'
import WomanMe from './pages/woman/Me'
import WomanNav from './components/WomanNav'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Frame({ children }) {
  const big = useStore(s => s.bigText)
  return (
    <div className="app-frame paper-ground" style={{ fontSize: big ? '17.5px' : '16px' }}>
      {children}
    </div>
  )
}

function AshaLayout() {
  const loggedIn = useStore(s => s.loggedIn)
  if (!loggedIn) return <Navigate to="/login" replace />
  return (
    <Frame>
      <div className="flex-1 flex flex-col min-h-0"><Outlet /></div>
      <BottomNav />
    </Frame>
  )
}

function Plain() {
  const loggedIn = useStore(s => s.loggedIn)
  if (!loggedIn) return <Navigate to="/login" replace />
  return <Frame><Outlet /></Frame>
}

function Open() { return <Frame><Outlet /></Frame> }

function WomanLayout() {
  return (
    <Frame>
      <div className="flex-1 flex flex-col min-h-0"><Outlet /></div>
      <WomanNav />
    </Frame>
  )
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Frame><Landing /></Frame>} />
        <Route path="/portals" element={<Frame><Portals /></Frame>} />
        <Route path="/login" element={<Frame><Login /></Frame>} />

        <Route element={<AshaLayout />}>
          <Route path="/asha" element={<Home />} />
          <Route path="/asha/families" element={<Families />} />
          <Route path="/asha/add" element={<Add />} />
          <Route path="/asha/assistant" element={<Assistant />} />
          <Route path="/asha/earnings" element={<Earnings />} />
        </Route>

        <Route element={<Plain />}>
          <Route path="/asha/more" element={<More />} />
          <Route path="/asha/profile" element={<Profile />} />
          <Route path="/asha/diagnostics" element={<Diagnostics />} />
          <Route path="/asha/scan" element={<ScanForm />} />
          <Route path="/asha/new-schema" element={<NewSchema />} />
          <Route path="/asha/reminders" element={<Reminders />} />
          <Route path="/asha/portal" element={<GovPortal />} />
          <Route path="/asha/forms" element={<Forms />} />
          <Route path="/asha/forms/:code" element={<FormPick />} />
          <Route path="/asha/forms/:code/fill/:memberId" element={<FormFill />} />
          <Route path="/asha/submissions" element={<Submissions />} />
          <Route path="/asha/families/new" element={<NewHousehold />} />
          <Route path="/asha/people/new" element={<NewPerson />} />
          <Route path="/asha/family/:id" element={<Family />} />
          <Route path="/asha/visit/:householdId" element={<VisitType />} />
          <Route path="/asha/consent" element={<Consent />} />
          <Route path="/asha/capture" element={<AskOnce />} />
          <Route path="/asha/review" element={<Review />} />
          <Route path="/asha/outputs/:encId" element={<Outputs />} />
          <Route path="/asha/paper/:encId" element={<Paper />} />
          <Route path="/asha/sync" element={<SyncPage />} />
          <Route path="/asha/proof" element={<Proof />} />
        </Route>

        <Route element={<Open />}>
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/officer/add-programme" element={<AddProgramme />} />
          <Route path="/officer/forms" element={<OfficerForms />} />
        </Route>

        <Route element={<WomanLayout />}>
          <Route path="/woman" element={<WomanHome />} />
          <Route path="/woman/records" element={<WomanRecords />} />
          <Route path="/woman/schemes" element={<WomanSchemes />} />
          <Route path="/woman/ask" element={<WomanAsk />} />
          <Route path="/woman/me" element={<WomanMe />} />
        </Route>

        <Route element={<Open />}>
          <Route path="/woman/scheme/:code" element={<WomanSchemeDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
