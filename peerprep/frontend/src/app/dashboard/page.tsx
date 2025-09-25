import UserWidget from "./widgets/userWidget"
import MatchingWidget from "./widgets/matchingWidget"
import QuestionHistoryWidget from "./widgets/questionHistWidget"
const userName = "@coolguy123"
export default function DashboardPage() {
  return (
    <div className="bg-dark-blue-bg h-screen w-screen flex flex-col pt-7 pl-12 pr-12">

      <div className="flex items-start justify-between">
        <div className="flex-col">
          <div className="flex items-start mb-5">
            <span className="font-inter text-logo-purple text-8xl font-bold">Peer</span>
            <span className="font-inter text-logo-green text-8xl font-bold">Prep</span>
          </div>
          <p className="font-poppins text-text-main text-6xl font-bold">
            Welcome back, {userName}!
          </p>
        </div>
        <div className="flex items-end"> 
          <UserWidget />
        </div>
      </div>

      <div className="flex-col m-5">
        <div className="bg-dark-box h-1.5 rounded-2xl mb-3"></div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <p className="text-text-main font-poppins text-5xl p-3">Dive into a problem
            </p>
            <MatchingWidget/>
          </div>
          <div>
            <p className="text-text-main font-poppins text-5xl p-3">Question History
            </p>
            <QuestionHistoryWidget/>
          </div>
        </div>
      </div> 
    </div>
  )
}