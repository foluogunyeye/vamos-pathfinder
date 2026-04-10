import vamosLogo from "@/assets/vamos_logo.png";

const ChatHeader = () => {
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-primary shadow-sm">
      <img src={vamosLogo} alt="Vamos" className="h-8 w-8 rounded-md bg-primary-foreground p-0.5" />
      <h1 className="text-lg font-bold text-primary-foreground tracking-tight">Vamos</h1>
    </header>
  );
};

export default ChatHeader;

