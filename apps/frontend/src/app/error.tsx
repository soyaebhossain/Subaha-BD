'use client';
import Icon from "@/components/Icon";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="empty-state" role="alert"><span className="empty-icon"><Icon name="box" /></span><h2>We hit a small bump.</h2><p>This page couldn’t be loaded. Give it another try in a moment.</p><button onClick={reset} className="button-primary">Try again <Icon name="arrow" width={16} height={16} /></button></div>;
}
