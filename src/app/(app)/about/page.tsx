
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Info, Users, Heart, BookOpen, Code, GitBranch, Award, Building, Mail } from 'lucide-react';
import Link from 'next/link';

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

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-8 md:space-y-12">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
          <Info className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          About Polyglot
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          Breaking language barriers and fostering understanding.
        </p>
      </header>

      <section id="mission" className="p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <Heart className="w-7 h-7 mr-3 text-primary" />
          Our Mission
        </h2>
        <div className="text-muted-foreground space-y-3 text-base text-justify">
          <p>
            Polyglot is dedicated to bridging communication gaps by providing accessible and reliable translation tools.
          </p>
          <p>
            Our goal is to empower individuals, promote cultural exchange, and make information more accessible to all, regardless of linguistic background.
          </p>
        </div>
      </section>

      <section id="story" className="p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <BookOpen className="w-7 h-7 mr-3 text-primary" />
          Project Story
        </h2>
        <div className="text-muted-foreground space-y-3 text-base text-justify">
          <p>
            This application was born from a passion for technology and a deep appreciation for the world's rich linguistic diversity.
          </p>
          <p>
            We recognized the need for tools that make inter-language communication easier. This app represents our commitment to leveraging technology for positive social impact.
          </p>
        </div>
      </section>

      <section id="team">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <Users className="w-7 h-7 mr-3 text-primary" />
          The Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center p-4 rounded-lg border bg-muted/20 hover:border-primary/50 transition-colors">
              <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
                <AvatarImage src={`https://placehold.co/100x100.png?text=${member.initials}`} alt={member.name} data-ai-hint={member.avatarHint} />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-lg">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="acknowledgements" className="p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <Award className="w-7 h-7 mr-3 text-primary" />
          Acknowledgements
        </h2>
        <div className="space-y-4">
          {acknowledgements.map((ack) => (
            <div key={ack.name} className="flex items-start gap-4">
              <ack.icon className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-base">{ack.name}</p>
                <p className="text-sm text-muted-foreground">{ack.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="tech" className="p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <Code className="w-7 h-7 mr-3 text-primary" />
          Technology & Credits
        </h2>
        <p className="mb-4 text-muted-foreground text-justify">Polyglot is built with modern technologies and relies on several fantastic tools and services:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          {techCredits.map((tech) => (
            <li key={tech.name}>
              <span className="font-medium text-foreground">{tech.name}:</span> {tech.description}
            </li>
          ))}
        </ul>
      </section>

       <section id="version" className="p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <GitBranch className="w-7 h-7 mr-3 text-primary" />
          Version Information
        </h2>
        <div className="text-muted-foreground space-y-2 text-base">
          <p>Polyglot Version: {APP_VERSION}</p>
          <p className="text-justify">
            We are continuously working to improve Polyglot. For the latest updates, please check our project repository or announcements.
          </p>
        </div>
      </section>

      <section id="contact" className="text-center p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 mr-3 text-primary" />
          Contact & Feedback
        </h2>
        <p className="text-muted-foreground mb-4 max-w-2xl mx-auto text-justify">
          Your feedback is invaluable to us! If you have questions, suggestions, or encounter issues, please reach out.
        </p>
        <Button asChild className="btn-animated">
          <Link href={`mailto:anchrisoft@gmail.com?subject=Polyglot%20Feedback`}>
            <Mail className="mr-2 h-4 w-4" /> Email Us
          </Link>
        </Button>
      </section>
    </div>
  );
}
