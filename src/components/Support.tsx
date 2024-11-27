import React from 'react';
import { Heart, Home, Book, Globe, ExternalLink } from 'lucide-react';

export const Support: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Support the Dhamma</h2>
        </div>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            Metta Voice is free software created to support Buddhist practice. If you find it helpful, please consider supporting the following monasteries and organizations that preserve and share the Buddha's teachings:
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Home className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Metta Forest Monastery (Wat Metta)</h2>
        </div>
        
        <div className="prose dark:prose-invert max-w-none space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            Metta Forest Monastery, under the guidance of Thanissaro Bhikkhu (Ajaan Geoff), is a meditation monastery in the Thai Forest Tradition. The monastery offers:
          </p>
          
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            <li>Free Dhamma books and talks</li>
            <li>Meditation instruction</li>
            <li>Day and overnight visits</li>
            <li>Regular meditation retreats</li>
          </ul>

          <div className="flex flex-col space-y-2">
            <a 
              href="https://www.watmetta.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-base"
            >
              <Globe size={16} />
              <span>Visit Wat Metta Website</span>
              <ExternalLink size={16} />
            </a>
            <a 
              href="https://www.dhammatalks.org/donations.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-base"
            >
              <Heart size={16} />
              <span>Support Wat Metta</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Book className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Dhamma Resources</h2>
        </div>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">DhammaTalks.org</h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              The main website of Thanissaro Bhikkhu and Metta Forest Monastery, offering thousands of free Dhamma talks, books, and translations of the Pali Canon.
            </p>
            <a 
              href="https://www.dhammatalks.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-base mt-2"
            >
              <Globe size={16} />
              <span>Visit DhammaTalks.org</span>
              <ExternalLink size={16} />
            </a>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Forest Dhamma</h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Provides free publications of Dhamma talks and books by Ajaan Mahā Boowa and his disciples. The translations are by Ajaan Paññavaddho, Thanissaro Bhikkhu, and Bhikkhu Silaratano.
            </p>
            <a 
              href="https://forestdhamma.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-base mt-2"
            >
              <Globe size={16} />
              <span>Visit Forest Dhamma</span>
              <ExternalLink size={16} />
            </a>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">TheravadaCN.org</h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Offers Chinese translations of many Theravada writings from DhammaTalks.org and Access to Insight, making these valuable teachings accessible to Chinese-speaking practitioners.
            </p>
            <a 
              href="https://theravadacn.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-base mt-2"
            >
              <Globe size={16} />
              <span>Visit TheravadaCN.org</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};