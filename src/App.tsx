import { Captions } from './components/Captions';
import { LuceFace } from './components/LuceFace';
import { ParentCorner } from './components/ParentCorner';
import { PictureChoices } from './components/PictureChoices';
import { StatusLine } from './components/StatusLine';
import { useConversationSession } from './hooks/useConversationSession';

export default function App() {
  const session = useConversationSession();

  const onFaceTap = () => {
    if (!session.sessionActive) {
      session.startSession();
      return;
    }
    // One tap starts session; while active, face tap is a no-op during talk,
    // or re-arms listen if somehow idle. Picture path always stays available.
    if (session.status === 'tap') {
      session.startSession();
    }
  };

  return (
    <div className="app-shell">
      <ParentCorner
        naomiCaption={session.naomiCaption}
        luceCaption={session.luceCaption}
        status={session.status}
        sessionActive={session.sessionActive}
        sttSupported={session.sttSupported}
        onHangUp={session.hangUp}
      />

      <main className="stage">
        <LuceFace status={session.status} onTap={onFaceTap} />
        <StatusLine status={session.status} sttSupported={session.sttSupported} />
        <Captions naomi={session.naomiCaption} luce={session.luceCaption} />
        <PictureChoices
          choices={session.choices}
          disabled={false}
          onChoose={session.onPictureTap}
        />
      </main>
    </div>
  );
}
