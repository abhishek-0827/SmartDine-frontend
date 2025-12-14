import Sidebar from './Sidebar'
import TopHeader from './TopHeader'

function AppLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <TopHeader />
                <div className="content-area">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AppLayout
