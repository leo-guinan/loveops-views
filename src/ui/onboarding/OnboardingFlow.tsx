import React, { useState, useEffect, useRef } from "react";
import { Screen0Landing } from "./Screen0Landing";
import { Screen1DocUpload } from "./Screen1DocUpload";
import { Screen2Processing } from "./Screen2Processing";
import { Screen3CompatibilityPreview } from "./Screen3CompatibilityPreview";
import { Screen4SparkIntro } from "./Screen4SparkIntro";
import { Screen5ArchetypePreview } from "./Screen5ArchetypePreview";
import { Screen6Paywall } from "./Screen6Paywall";
import { Screen8AccountCreation } from "./Screen8AccountCreation";
import { Screen9EngineLive } from "./Screen9EngineLive";
import { Screen10FirstSpark } from "./Screen10FirstSpark";
import { Screen11InviteFriend } from "./Screen11InviteFriend";
import { Screen12Dashboard } from "./Screen12Dashboard";
import { DateMeDocFlow } from "./DateMeDocFlow";
import { OnboardingStateMachine, OnboardingScreen, OnboardingStateData } from "./OnboardingStateMachine";

type OnboardingFlowProps = {
  onComplete?: (userId: string) => void;
  userId?: string | null;
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, userId: existingUserId }) => {
  // Initialize state machine
  const stateMachineRef = useRef<OnboardingStateMachine>(
    new OnboardingStateMachine(
      undefined,
      { userId: existingUserId || undefined }
    )
  );

  const [stateMachine] = useState(() => stateMachineRef.current);
  const [state, setState] = useState<OnboardingStateData>(() => stateMachine.getData());
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>(() => stateMachine.getCurrentScreen());
  
  // Clear payment flag after loading (but keep data)
  useEffect(() => {
    if (stateMachine.getData().paymentCompleted && typeof window !== 'undefined') {
      sessionStorage.removeItem("loveops_paymentComplete");
    }
  }, [stateMachine]);

  // Call onComplete when reaching dashboard
  useEffect(() => {
    if (currentScreen === OnboardingScreen.DASHBOARD && state.userId && onComplete) {
      onComplete(state.userId);
      // Clear persisted state when onboarding completes
      stateMachine.clearPersistedState();
    }
  }, [currentScreen, state.userId, onComplete, stateMachine]);

  // Mock data generators - in real app, these would come from API
  const generateCompatibility = () => ({
    emotionalRhythm: "You move through relationships with a steady emotional rhythm and a strong preference for depth over novelty.",
    communication: "You communicate with clarity, warmth, and intellectual curiosity.",
    preferences: "You thrive most with people who enjoy slow-burn conversations, shared meaning, and low-pressure environments.",
  });

  const generateSparkIntro = () => 
    "A thoughtful, creative mind who prefers meaningful conversation over small talk, and values emotional stability over spectacle.";

  const generateArchetype = () => ({
    title: "The Introspective Explorer",
    traits: [
      "communicate with patience",
      "enjoy intimate, low-noise spaces",
      "value emotional clarity",
      "share your depth-first orientation",
    ],
  });

  const generateFirstSpark = () => ({
    intro: "Someone who shares your warmth, loves curious conversation, and values emotional steadiness.",
    question: "What's a conversation that changed how you see something?",
    anecdote: "They mentioned how a late-night talk about childhood memories revealed more about compatibility than months of dating profiles.",
  });

  const handleScreen0Upload = () => {
    if (stateMachine.transitionTo(OnboardingScreen.DOC_UPLOAD)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };
  
  const handleScreen0NoDoc = () => {
    // For now, just proceed to doc upload
    if (stateMachine.transitionTo(OnboardingScreen.DOC_UPLOAD)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };
  
  const handleScreen0CreateDoc = () => {
    setState({ ...state, creatingDoc: true });
  };
  
  const handleDateMeDocComplete = async (docText: string) => {
    // Date-Me Doc created, now treat it as if it was uploaded
    const blob = new Blob([docText], { type: "text/plain" });
    const file = new File([blob], "date-me-doc.txt", { type: "text/plain" });
    
    // Close the doc creation flow
    setState((prevState) => ({ ...prevState, creatingDoc: false }));
    
    // Upload and process the file
    await handleScreen1Upload(file);
  };
  
  const handleDateMeDocCancel = () => {
    if (stateMachine.transitionTo(OnboardingScreen.LANDING)) {
      setState({ ...stateMachine.getData(), creatingDoc: false });
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen1Upload = async (file: File) => {
    // Move to processing screen immediately
    const tempUserId = state.userId || `temp-${Date.now()}`;
    
    if (stateMachine.transitionTo(OnboardingScreen.PROCESSING, {
      uploadedFile: file,
      isProcessing: true,
      userId: tempUserId,
    })) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
    
    // Upload and enqueue the file
    try {
      const formData = new FormData();
      formData.append("doc", file);
      formData.append("userId", tempUserId);

      const response = await fetch("/api/onboarding/process-doc", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to enqueue document");
      }

      const data = await response.json();
      
      // Job is queued, now poll for results
      pollJobStatus(data.jobId, tempUserId);
    } catch (error) {
      console.error("Error enqueueing document:", error);
      alert("Failed to queue your document for processing. Please try again.");
      // Go back to upload screen
      if (stateMachine.transitionTo(OnboardingScreen.DOC_UPLOAD, { isProcessing: false })) {
        setState(stateMachine.getData());
        setCurrentScreen(stateMachine.getCurrentScreen());
      }
    }
  };

  const pollJobStatus = async (jobId: string, userId: string) => {
    const maxAttempts = 120; // Poll for up to 2 minutes
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/onboarding/job-status/${jobId}`);
        
        if (!response.ok) {
          throw new Error("Failed to check job status");
        }

        const data = await response.json();
        
        console.log(`Job ${jobId} status: ${data.status} (queue state: ${data.queueState})`);
        
        if (data.status === "completed") {
          // Processing complete - use actual results from document analysis
          const compatibility = data.results?.compatibility || generateCompatibility();
          const sparkIntro = data.results?.sparkIntro || generateSparkIntro();
          const archetype = data.results?.archetype || generateArchetype();
          const finalReport = data.results?.finalReport;
          
          // Mark analysis as completed in state machine
          stateMachine.markAnalysisCompleted(compatibility, sparkIntro, archetype, finalReport);
          
          // Transition to compatibility preview screen
          if (stateMachine.transitionTo(OnboardingScreen.COMPATIBILITY_PREVIEW, {
            uploadedFile: state.uploadedFile,
            isProcessing: false,
            compatibility,
            sparkIntro,
            archetype,
            finalReport,
            userId: userId,
          })) {
            setState(stateMachine.getData());
            setCurrentScreen(stateMachine.getCurrentScreen());
          } else {
            console.error("Failed to transition to compatibility preview");
            setState((prevState) => ({
              ...prevState,
              isProcessing: false,
            }));
          }
        } else if (data.status === "failed") {
          throw new Error(data.results?.error || "Document processing failed");
        } else if (data.status === "not_found") {
          throw new Error("Job not found. Please try uploading again.");
        } else {
          // Still processing (queued, processing), poll again
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000); // Poll every second
          } else {
            throw new Error("Processing timeout - please try again");
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        alert(`Failed to check processing status: ${error instanceof Error ? error.message : "Unknown error"}`);
        // Go back to upload screen
        if (stateMachine.transitionTo(OnboardingScreen.DOC_UPLOAD, { isProcessing: false })) {
          setState(stateMachine.getData());
          setCurrentScreen(stateMachine.getCurrentScreen());
        }
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  const handleScreen2Complete = () => {
    // Only advance if compatibility data is available and analysis is completed
    if (stateMachine.canShowCompatibilityPreview()) {
      if (stateMachine.transitionTo(OnboardingScreen.COMPATIBILITY_PREVIEW)) {
        setState(stateMachine.getData());
        setCurrentScreen(stateMachine.getCurrentScreen());
      }
    } else {
      // Data not ready yet, stay on processing screen
      console.log("Waiting for compatibility data...");
    }
  };

  const handleScreen3Continue = () => {
    if (stateMachine.transitionTo(OnboardingScreen.SPARK_INTRO, {
      sparkIntro: state.sparkIntro || generateSparkIntro(),
    })) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen4Continue = () => {
    if (stateMachine.transitionTo(OnboardingScreen.ARCHETYPE_PREVIEW, {
      archetype: state.archetype || generateArchetype(),
    })) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen5Continue = () => {
    if (stateMachine.transitionTo(OnboardingScreen.PAYWALL)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen6PaymentComplete = () => {
    // Payment completed - mark it and transition to compatibility preview if analysis is done
    stateMachine.markPaymentCompleted();
    
    if (stateMachine.canShowCompatibilityPreview()) {
      // Show compatibility preview after payment (user already saw it, but show again)
      if (stateMachine.transitionTo(OnboardingScreen.COMPATIBILITY_PREVIEW)) {
        setState(stateMachine.getData());
        setCurrentScreen(stateMachine.getCurrentScreen());
      }
    } else {
      // Otherwise proceed to account creation
      if (stateMachine.transitionTo(OnboardingScreen.ACCOUNT_CREATION)) {
        setState(stateMachine.getData());
        setCurrentScreen(stateMachine.getCurrentScreen());
      }
    }
  };

  const handleScreen8Complete = (data: any) => {
    // Generate a mock userId
    const userId = `user-${Date.now()}`;
    if (stateMachine.transitionTo(OnboardingScreen.ENGINE_LIVE, {
      accountData: data,
      userId,
    })) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen9Continue = () => {
    if (stateMachine.transitionTo(OnboardingScreen.FIRST_SPARK)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen10Curious = () => {
    if (stateMachine.transitionTo(OnboardingScreen.INVITE_FRIEND)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen10NotForMe = () => {
    // Refine model - for now, just proceed
    if (stateMachine.transitionTo(OnboardingScreen.INVITE_FRIEND)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen11Invite = (email: string) => {
    // Send invite - for now, just proceed
    if (stateMachine.transitionTo(OnboardingScreen.DASHBOARD)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleScreen11Skip = () => {
    if (stateMachine.transitionTo(OnboardingScreen.DASHBOARD)) {
      setState(stateMachine.getData());
      setCurrentScreen(stateMachine.getCurrentScreen());
    }
  };

  const handleMatchSelect = (matchId: string) => {
    // Navigate to match detail - would use router in real app
    console.log('Navigate to match:', matchId);
  };

  // Show Date-Me Doc creation flow if active
  if (state.creatingDoc) {
    return (
      <DateMeDocFlow
        onComplete={handleDateMeDocComplete}
        onCancel={handleDateMeDocCancel}
      />
    );
  }

  // Render based on state machine's current screen
  switch (currentScreen) {
    case OnboardingScreen.LANDING:
      return (
        <Screen0Landing
          onUploadDoc={handleScreen0Upload}
          onNoDoc={handleScreen0NoDoc}
          onCreateDoc={handleScreen0CreateDoc}
        />
      );
    case OnboardingScreen.DOC_UPLOAD:
      return (
        <Screen1DocUpload 
          onDocUploaded={handleScreen1Upload} 
          onBack={() => {
            if (stateMachine.transitionTo(OnboardingScreen.LANDING)) {
              setState(stateMachine.getData());
              setCurrentScreen(stateMachine.getCurrentScreen());
            }
          }} 
        />
      );
    case OnboardingScreen.PROCESSING:
      // Only show processing if analysis is not already completed
      if (stateMachine.shouldShowProcessing()) {
        return <Screen2Processing onComplete={handleScreen2Complete} isProcessing={state.isProcessing} />;
      } else {
        // Analysis already done, transition to compatibility preview
        if (stateMachine.canShowCompatibilityPreview()) {
          if (stateMachine.transitionTo(OnboardingScreen.COMPATIBILITY_PREVIEW)) {
            setState(stateMachine.getData());
            setCurrentScreen(stateMachine.getCurrentScreen());
            // Fall through to show compatibility preview
          }
        }
        // Fall through to show compatibility preview or stay on processing
        return <Screen2Processing onComplete={handleScreen2Complete} isProcessing={false} />;
      }
    case OnboardingScreen.COMPATIBILITY_PREVIEW:
      if (!stateMachine.canShowCompatibilityPreview()) {
        // Can't show preview yet, show processing
        return <Screen2Processing onComplete={handleScreen2Complete} isProcessing={state.isProcessing} />;
      }
      return (
        <Screen3CompatibilityPreview
          compatibility={state.compatibility!}
          finalReport={state.finalReport}
          onContinue={handleScreen3Continue}
        />
      );
    case OnboardingScreen.SPARK_INTRO:
      return (
        <Screen4SparkIntro
          sparkIntro={state.sparkIntro!}
          onContinue={handleScreen4Continue}
        />
      );
    case OnboardingScreen.ARCHETYPE_PREVIEW:
      return (
        <Screen5ArchetypePreview
          archetype={state.archetype!}
          onContinue={handleScreen5Continue}
        />
      );
    case OnboardingScreen.PAYWALL:
      return (
        <Screen6Paywall
          userId={state.userId || "temp-user"}
          email={state.accountData?.email}
          referralCode={state.referralCode}
          onPaymentComplete={handleScreen6PaymentComplete}
          onWhyFee={() => {}}
        />
      );
    case OnboardingScreen.ACCOUNT_CREATION:
      return <Screen8AccountCreation onComplete={handleScreen8Complete} />;
    case OnboardingScreen.ENGINE_LIVE:
      return <Screen9EngineLive onContinue={handleScreen9Continue} />;
    case OnboardingScreen.FIRST_SPARK:
      return (
        <Screen10FirstSpark
          spark={generateFirstSpark()}
          onCurious={handleScreen10Curious}
          onNotForMe={handleScreen10NotForMe}
        />
      );
    case OnboardingScreen.INVITE_FRIEND:
      return (
        <Screen11InviteFriend
          onInvite={handleScreen11Invite}
          onSkip={handleScreen11Skip}
        />
      );
    case OnboardingScreen.DASHBOARD:
      return (
        <Screen12Dashboard
          userId={state.userId || "user-default"}
          onMatchSelect={handleMatchSelect}
        />
      );
    default:
      // Invalid state, reset to landing
      console.warn(`Invalid screen state: ${currentScreen}, resetting to landing`);
      if (stateMachine.transitionTo(OnboardingScreen.LANDING)) {
        setState(stateMachine.getData());
        setCurrentScreen(stateMachine.getCurrentScreen());
      }
      return <Screen0Landing onUploadDoc={handleScreen0Upload} onNoDoc={handleScreen0NoDoc} />;
  }
};
