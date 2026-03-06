import GoogleSpeechRecommendationModal from "@/components/GoogleSpeechRecommendationModal";
import {
  getSpeechRecommendationDismissed,
  setSpeechRecommendationDismissed,
  SpeechRecommendationContext,
} from "@/contexts/SpeechRecommendationContext";
import { useSpeechEngineRecommendation } from "@/hooks/useSpeechEngineRecommendation";
import { useCallback, useEffect, useState } from "react";

type Props = { children: React.ReactNode };

export default function SpeechRecommendationProvider({ children }: Props) {
  const { speechEngineRecommended, isLoading } = useSpeechEngineRecommendation();
  const [recommendationModalVisible, setRecommendationModalVisible] = useState(false);
  const [dismissedLoaded, setDismissedLoaded] = useState(false);

  const showRecommendationModal = useCallback(() => {
    setRecommendationModalVisible(true);
  }, []);

  const setDismissedPersisted = useCallback((dismissed: boolean) => {
    setSpeechRecommendationDismissed(dismissed);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSpeechRecommendationDismissed().then((dismissed) => {
      if (cancelled) return;
      setDismissedLoaded(true);
      if (!isLoading && !speechEngineRecommended && !dismissed) {
        setRecommendationModalVisible(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, speechEngineRecommended]);

  useEffect(() => {
    if (!dismissedLoaded || isLoading) return;
    if (speechEngineRecommended) setRecommendationModalVisible(false);
  }, [dismissedLoaded, speechEngineRecommended, isLoading]);

  const handleContinueWithoutInstalling = useCallback(() => {
    setSpeechRecommendationDismissed(true);
  }, []);

  const value = {
    speechEngineRecommended,
    showRecommendationModal,
    recommendationModalVisible,
    setRecommendationModalVisible,
    setDismissedPersisted,
  };

  return (
    <SpeechRecommendationContext.Provider value={value}>
      {children}
      <GoogleSpeechRecommendationModal
        visible={recommendationModalVisible}
        onClose={() => setRecommendationModalVisible(false)}
        onContinueWithoutInstalling={handleContinueWithoutInstalling}
      />
    </SpeechRecommendationContext.Provider>
  );
}
