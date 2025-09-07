import mixgenieLogo from "../images/mixgenie.png"; 

const Header = () => {
  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary overflow-hidden">
          <img
            src={mixgenieLogo}
            alt="MixGenie Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Mixing Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Professional audio mixing powered by AI
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
