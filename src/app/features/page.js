import FeaturesClient from './FeaturesClient';

export const metadata = {
  title: 'مميزات دريدود',
  description: 'استكشف أقسام دريدود: الرئيسية، الاستكشاف، المجموعات، القنوات، المحادثات، والقصص في واجهة واحدة.',
  alternates: { canonical: '/features' },
};

export default function Features() {
  return <FeaturesClient />;
}
