import React from 'react';
import { BookOpen, Scale, Shield } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">About Metta Voice</h2>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            Metta Voice is a meditation application designed to help practitioners deepen their practice through the study and contemplation of Buddhist suttas. Our platform combines traditional teachings with modern accessibility features, making ancient wisdom more accessible to contemporary practitioners.
          </p>
          <br></br>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            The application offers a unique blend of features including daily suttas, text-to-speech capabilities, and customizable meditation timers. We believe in making meditation and Buddhist teachings accessible to everyone, regardless of their experience level or physical abilities.
          </p>
          <br></br>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            Metta Voice is developed and maintained by <a href="https://mettabit.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover">MettaBit</a>. Visit our website to learn more about our mission and other projects.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Scale className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Licenses</h2>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Software License</h3>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            Metta Voice software is licensed under the GNU Affero General Public License version 3 (AGPL-3.0).
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            This means:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 text-base leading-relaxed list-disc pl-6">
            <li>You can freely use, modify, and distribute this software</li>
            <li>If you modify and share this software, you must:
              <ul className="list-disc pl-6 mt-2">
                <li>Make your modifications available under the same license</li>
                <li>Preserve copyright notices and license information</li>
                <li>Provide access to the complete source code</li>
              </ul>
            </li>
            <li>If you run a modified version on a server, you must make the complete source code available to users</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mt-4">
            For the complete software license text, visit the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover">GNU AGPL-3.0 License</a> page.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">Content License</h3>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            All Buddhist texts and teachings in this app are provided under the Creative Commons Attribution-NonCommercial 4.0 Unported License. Here's what you need to know:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 text-base leading-relaxed list-disc pl-6">
            <li><strong>Use:</strong> You can use these teachings freely for personal or non-commercial purposes.</li>
            <li><strong>Distribution:</strong> You are encouraged to distribute these teachings as long as it's done in a way that aligns with the principles of the Dhamma.</li>
            <li><strong>Attribution:</strong> Always give credit to the original source.</li>
            <li><strong>Non-Commercial:</strong> Do not sell this content or use it for any commercial purposes. This includes sales by non-profit organizations, as any sale is considered commercial by the copyright holders.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mt-4">
            <strong>Modifications:</strong> We aim to keep the suttas as faithful to the original texts from dhammatalks.org. However, if any modifications are made, they will be clearly noted within the text itself. We will remove pagination, indices, and footnotes to enhance your meditation experience, as these might be distracting.
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mt-4">
            For the full license details, visit the <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover">Creative Commons License</a> page.
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mt-4">
            By using this app, you agree to respect these guidelines to help spread the Dhamma in the spirit it was intended.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Privacy Policy</h2>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            We take your privacy seriously. Metta Voice is designed to respect user privacy and minimize data collection.
          </p>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Data Collection</h3>
          <ul className="text-gray-700 dark:text-gray-300 text-base leading-relaxed list-disc pl-6">
            <li>All data is stored locally in your browser</li>
            <li>No personal information is collected or transmitted</li>
            <li>No analytics or tracking tools are used</li>
            <li>Settings and preferences are saved only on your device</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Third-Party Services</h3>
          <ul className="text-gray-700 dark:text-gray-300 text-base leading-relaxed list-disc pl-6">
            <li>Text-to-speech functionality uses your browser's built-in capabilities</li>
            <li>Sutta texts are retrieved from dhammatalks.org</li>
            <li>No third-party analytics or tracking services are used</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Data Storage</h3>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            Your settings and preferences are stored using browser local storage. You can clear this data at any time by:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 text-base leading-relaxed list-disc pl-6">
            <li>Clearing your browser's local storage</li>
            <li>Using your browser's privacy/incognito mode</li>
            <li>Using the reset options within the application</li>
          </ul>
        </div>
      </section>
    </div>
  );
};