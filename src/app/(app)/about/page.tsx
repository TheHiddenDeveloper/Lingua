
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Info, Users, Heart, BookOpen, Code, Layers, GitBranch, Award, Building, Mail } from 'lucide-react';
import Link from 'next/link';

// Placeholder for version - in a real app, this might come from package.json or build process
const APP_VERSION = '1.0.0';

const teamMembers = [
  { name: 'Anchirinaah Hezekiah', role: 'Project Lead / Lead Developer', initials: 'AH', avatarHint: 'person student' },
  { name: 'Hagan Kweku Rodney', role: 'Frontend Developer / UI-UX Designer', initials: 'HR', avatarHint: 'person student' },
  { name: 'Omari Adjei Silas', role: 'Backend Developer / AI Integration Specialist', initials: 'OS', avatarHint: 'person student' },
];

const acknowledgements = [
  { name: 'Dr. Alfred Adutwum Amponsah', role: 'Project Supervisor, UMaT', icon: Award },
  { name: 'University of Mines and Technology (UMaT), Tarkwa', role: 'Academic Institution', icon: Building },
  { name: 'GhanaNLP', role: 'Providing the core Translation, TTS, and ASR APIs', icon: Heart },
];

const techCredits = [
  { name: 'Next.js & React', description: 'For the core application framework and UI.' },
  { name: 'TypeScript', description: 'For robust, type-safe code.' },
  { name: 'ShadCN UI & Radix UI', description: 'For pre-built, accessible UI components.' },
  { name: 'Tailwind CSS', description: 'For utility-first styling.' },
  { name: 'Genkit (by Firebase)', description: 'For integrating generative AI features.' },
  { name: 'Firebase', description: 'For authentication, Firestore database, and hosting.' },
  { name: 'GhanaNLP API', description: 'For translation, text-to-speech, and speech-to-text services.' },
  { name: 'Lucide React', description: 'For clear and beautiful icons.' },
];

// Placeholder for multilingual content.
// In a real app, you'd use an i18n library.
// const t = useTranslations('AboutPage');

export default function AboutPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">
      <div className="text-center md:text-left">
        <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start">
          <Info className="w-8 h-8 mr-3 text-primary" />
          About LinguaGhana
          {/* Example: {t('title')} */}
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2">
          Breaking language barriers and fostering understanding across Ghana.
          {/* Example: {t('subtitle')} */}
        </p>
      </div>

      <Card id="mission" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <Heart className="w-6 h-6 mr-3 text-primary" />
            Our Mission
            {/* Example: {t('mission.title')} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 text-sm md:text-base text-muted-foreground space-y-2">
          <p>
            LinguaGhana is dedicated to bridging communication gaps within Ghana by providing accessible and reliable translation tools. 
            We aim to support seamless translation between English and key Ghanaian languages including Twi, Ga, Dagbani, and Ewe.
            {/* Example: {t('mission.paragraph1')} */}
          </p>
          <p>
            Our goal is to empower individuals, promote cultural exchange, and make information more accessible to all, regardless of linguistic background.
            {/* Example: {t('mission.paragraph2')} */}
          </p>
        </CardContent>
      </Card>

      <Card id="story" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <BookOpen className="w-6 h-6 mr-3 text-primary" />
            Project Story
            {/* Example: {t('story.title')} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 text-sm md:text-base text-muted-foreground space-y-2">
          <p>
            LinguaGhana was born as a final year undergraduate project at the prestigious University of Mines and Technology (UMaT), Tarkwa. 
            The project was driven by a passion for technology and a deep appreciation for Ghana&apos;s rich linguistic diversity.
            {/* Example: {t('story.paragraph1')} */}
          </p>
          <p>
            We recognized the cultural significance of local languages and the need for tools that make inter-language communication easier. 
            This app represents our commitment to leveraging technology for positive social impact and celebrating Ghanaian heritage.
            {/* Example: {t('story.paragraph2')} */}
          </p>
        </CardContent>
      </Card>

      <Card id="team" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <Users className="w-6 h-6 mr-3 text-primary" />
            The Team
            {/* Example: {t('team.title')} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center p-3 rounded-lg border bg-card/50 hover:shadow-md transition-shadow">
              <Avatar className="w-20 h-20 mb-3 border-2 border-primary">
                <AvatarImage src={`https://placehold.co/100x100.png?text=${member.initials}`} alt={member.name} data-ai-hint={member.avatarHint} />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm md:text-base">{member.name}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card id="acknowledgements" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <Award className="w-6 h-6 mr-3 text-primary" />
            Acknowledgements
            {/* Example: {t('acknowledgements.title')} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 space-y-3">
          {acknowledgements.map((ack) => (
            <div key={ack.name} className="flex items-start gap-3">
              <ack.icon className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm md:text-base">{ack.name}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{ack.role}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card id="tech" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <Code className="w-6 h-6 mr-3 text-primary" />
            Technology & Credits
            {/* Example: {t('tech.title')} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 text-sm text-muted-foreground">
          <p className="mb-3">LinguaGhana is built with modern technologies and relies on several fantastic tools and services:</p>
          {/* Example: {t('tech.intro')} */}
          <ul className="list-disc list-inside space-y-1.5">
            {techCredits.map((tech) => (
              <li key={tech.name}>
                <span className="font-medium text-foreground">{tech.name}:</span> {tech.description}
                {/* Example: <span className="font-medium text-foreground">{t(`tech.${tech.name}.name`)}:</span> {t(`tech.${tech.name}.description`)} */}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

       <Card id="version" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <GitBranch className="w-6 h-6 mr-3 text-primary" />
            Version Information
            {/* Example: {t('version.title')} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 text-sm md:text-base text-muted-foreground">
          <p>LinguaGhana Version: {APP_VERSION}</p>
          {/* Example: <p>{t('version.currentVersion', { version: APP_VERSION })}</p> */}
          <p className="mt-1">
            We are continuously working to improve LinguaGhana. For the latest updates, please check our project repository or announcements.
            {/* Example: {t('version.updates')} */}
          </p>
        </CardContent>
      </Card>

      <Card id="contact" className="card-animated">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-xl md:text-2xl">
            <Mail className="w-6 h-6 mr-3 text-primary" />
            Contact & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <p className="text-sm text-muted-foreground mb-4">
            Your feedback is invaluable to us! If you have questions, suggestions, or encounter issues, please reach out.
          </p>
          <Button asChild className="btn-animated w-full sm:w-auto">
            <Link href={`mailto:anchrisoft@gmail.com?subject=LinguaGhana%20Feedback`}>
              <Mail className="mr-2 h-4 w-4" /> Email Us
            </Link>
          </Button>
           {/* A note about future dynamic content for multilingual support.
             * For a production app with extensive multilingual help/about content,
             * fetching this content from Firestore or a CMS would be beneficial
             * to allow updates without redeploying the app. Example structure:
             * /appContent/{locale}/aboutPage/(document with fields for each section)
             * /appContent/{locale}/helpPage/(document with fields for each FAQ)
          */}
        </CardContent>
      </Card>
    </div>
  );
}

    