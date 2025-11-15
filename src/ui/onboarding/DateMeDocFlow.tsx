import React, { useState } from "react";
import { DateMeDocScreen1Name } from "./DateMeDocScreens/Screen1Name";
import { DateMeDocScreen2WhoYouAre } from "./DateMeDocScreens/Screen2WhoYouAre";
import { DateMeDocScreen3HowIMove } from "./DateMeDocScreens/Screen3HowIMove";
import { DateMeDocScreen4LookingFor } from "./DateMeDocScreens/Screen4LookingFor";
import { DateMeDocScreen5DontWant } from "./DateMeDocScreens/Screen5DontWant";
import { DateMeDocScreen6SureAbout } from "./DateMeDocScreens/Screen6SureAbout";
import { DateMeDocScreen7FiguringOut } from "./DateMeDocScreens/Screen7FiguringOut";
import { DateMeDocScreen8HowToStart } from "./DateMeDocScreens/Screen8HowToStart";
import { DateMeDocScreen9Signals } from "./DateMeDocScreens/Screen9Signals";
import { DateMeDocScreen10ReachOut } from "./DateMeDocScreens/Screen10ReachOut";
import { DateMeDocScreen11Review } from "./DateMeDocScreens/Screen11Review";

type DateMeDocState = {
  screen: number;
  name: string;
  whoYouAre: string;
  howIMove: string[];
  lookingFor: string;
  dontWant: string[];
  sureAbout: string;
  figuringOut: string;
  howToStart: string;
  signals: string[];
  reachOut: string;
};

type DateMeDocFlowProps = {
  onComplete: (docText: string) => void;
  onCancel: () => void;
};

export const DateMeDocFlow: React.FC<DateMeDocFlowProps> = ({ onComplete, onCancel }) => {
  const [state, setState] = useState<DateMeDocState>({
    screen: 1,
    name: "",
    whoYouAre: "",
    howIMove: [],
    lookingFor: "",
    dontWant: [],
    sureAbout: "",
    figuringOut: "",
    howToStart: "",
    signals: [],
    reachOut: "",
  });

  const handleScreen1Complete = (name: string) => {
    setState({ ...state, screen: 2, name });
  };

  const handleScreen2Complete = (whoYouAre: string) => {
    setState({ ...state, screen: 3, whoYouAre });
  };

  const handleScreen3Complete = (howIMove: string[]) => {
    setState({ ...state, screen: 4, howIMove });
  };

  const handleScreen4Complete = (lookingFor: string) => {
    setState({ ...state, screen: 5, lookingFor });
  };

  const handleScreen5Complete = (dontWant: string[]) => {
    setState({ ...state, screen: 6, dontWant });
  };

  const handleScreen6Complete = (sureAbout: string) => {
    setState({ ...state, screen: 7, sureAbout });
  };

  const handleScreen7Complete = (figuringOut: string) => {
    setState({ ...state, screen: 8, figuringOut });
  };

  const handleScreen8Complete = (howToStart: string) => {
    setState({ ...state, screen: 9, howToStart });
  };

  const handleScreen9Complete = (signals: string[]) => {
    setState({ ...state, screen: 10, signals });
  };

  const handleScreen10Complete = (reachOut: string) => {
    setState({ ...state, screen: 11, reachOut });
  };

  const handleScreen11Complete = () => {
    // Format the document according to the template
    const docText = formatDateMeDoc(state);
    onComplete(docText);
  };

  const formatDateMeDoc = (state: DateMeDocState): string => {
    return `Hi, I'm ${state.name}.

${state.whoYouAre}

How I move through relationships

${state.howIMove.map((item) => `• ${item}`).join("\n")}

What I'm looking for

${state.lookingFor}

What I know I don't want

${state.dontWant.map((item) => `• ${item}`).join("\n")}

What I'm sure about

${state.sureAbout}

What I'm still figuring out

${state.figuringOut}

How I like to start

${state.howToStart}

Signals we might be a good match

${state.signals.map((item) => `• ${item}`).join("\n")}

How to reach out

${state.reachOut}`;
  };

  switch (state.screen) {
    case 1:
      return <DateMeDocScreen1Name onComplete={handleScreen1Complete} onCancel={onCancel} />;
    case 2:
      return (
        <DateMeDocScreen2WhoYouAre
          onComplete={handleScreen2Complete}
          onBack={() => setState({ ...state, screen: 1 })}
        />
      );
    case 3:
      return (
        <DateMeDocScreen3HowIMove
          onComplete={handleScreen3Complete}
          onBack={() => setState({ ...state, screen: 2 })}
        />
      );
    case 4:
      return (
        <DateMeDocScreen4LookingFor
          onComplete={handleScreen4Complete}
          onBack={() => setState({ ...state, screen: 3 })}
        />
      );
    case 5:
      return (
        <DateMeDocScreen5DontWant
          onComplete={handleScreen5Complete}
          onBack={() => setState({ ...state, screen: 4 })}
        />
      );
    case 6:
      return (
        <DateMeDocScreen6SureAbout
          onComplete={handleScreen6Complete}
          onBack={() => setState({ ...state, screen: 5 })}
        />
      );
    case 7:
      return (
        <DateMeDocScreen7FiguringOut
          onComplete={handleScreen7Complete}
          onBack={() => setState({ ...state, screen: 6 })}
        />
      );
    case 8:
      return (
        <DateMeDocScreen8HowToStart
          onComplete={handleScreen8Complete}
          onBack={() => setState({ ...state, screen: 7 })}
        />
      );
    case 9:
      return (
        <DateMeDocScreen9Signals
          onComplete={handleScreen9Complete}
          onBack={() => setState({ ...state, screen: 8 })}
        />
      );
    case 10:
      return (
        <DateMeDocScreen10ReachOut
          onComplete={handleScreen10Complete}
          onBack={() => setState({ ...state, screen: 9 })}
        />
      );
    case 11:
      return (
        <DateMeDocScreen11Review
          docText={formatDateMeDoc(state)}
          onComplete={handleScreen11Complete}
          onBack={() => setState({ ...state, screen: 10 })}
        />
      );
    default:
      return <DateMeDocScreen1Name onComplete={handleScreen1Complete} onCancel={onCancel} />;
  }
};

