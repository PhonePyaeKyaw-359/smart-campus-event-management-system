import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__main">
        <div className="layout__content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
