import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="app-layout">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
