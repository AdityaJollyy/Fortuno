// Shared page container (--container-page, 1280px) with 20px gutters, 32px at
// md. The pt clears the fixed header (64px, 72px at md) and adds the frame
// gutter on top of it.
const MainLayout = ({ children }) => {
  return (
    <div className="max-w-page mx-auto w-full px-5 pt-22 pb-12 md:px-8 md:pt-26 md:pb-16">
      {children}
    </div>
  );
};

export default MainLayout;
