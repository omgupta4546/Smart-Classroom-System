import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main style={{ paddingTop: '100px' }}>
                {children}
            </main>
        </>
    );
};

export default Layout;
