// src/pages/MembersPage.jsx
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const MembersPage = () => {
    const { language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const members = [
        { name: "Republic of AZERBAIJAN", flag: "https://flagpedia.net/data/flags/w580/az.webp", joined: "1992", region: "Asia" },
        { name: "Hashemite Kingdom of JORDAN", flag: "https://flagpedia.net/data/flags/w580/jo.webp", joined: "1969", region: "Middle East" },
        { name: "Islamic Republic of AFGHANISTAN", flag: "https://cdn.britannica.com/40/5340-004-B25ED5CF/Flag-Afghanistan.jpg", joined: "1969", region: "Asia" },
        { name: "Republic of ALBANIA", flag: "https://flagpedia.net/data/flags/w580/al.webp", joined: "1992", region: "Europe" },
        { name: "State of The UNITED ARAB EMIRATES", flag: "https://flagpedia.net/data/flags/w580/ae.webp", joined: "1972", region: "Middle East" },
        { name: "Republic of INDONESIA", flag: "https://flagpedia.net/data/flags/w580/id.png", joined: "1969", region: "Asia" },
        { name: "Republic of UZBEKISTAN", flag: "https://flagpedia.net/data/flags/w580/uz.webp", joined: "1996", region: "Asia" },
        { name: "Republic of UGANDA", flag: "https://flagpedia.net/data/flags/w580/ug.webp", joined: "1974", region: "Africa" },
        { name: "Islamic Republic of IRAN", flag: "https://flagpedia.net/data/flags/w580/ir.webp", joined: "1969", region: "Middle East" },
        { name: "Islamic Republic of PAKISTAN", flag: "https://flagpedia.net/data/flags/w580/pk.webp", joined: "1969", region: "Asia" },
        { name: "Kingdom of BAHRAIN", flag: "https://flagpedia.net/data/flags/w580/bh.webp", joined: "1972", region: "Middle East" },
        { name: "BRUNEI-DARUSSALAM", flag: "https://flagpedia.net/data/flags/w580/bn.webp", joined: "1984", region: "Asia" },
        { name: "People's Republic of BANGLADESH", flag: "https://flagpedia.net/data/flags/w580/bd.webp", joined: "1974", region: "Asia" },
        { name: "Republic of BENIN", flag: "https://flagpedia.net/data/flags/w580/bj.png", joined: "1983", region: "Africa" },
        { name: "Burkina Faso", flag: "https://flagpedia.net/data/flags/w580/bf.webp", joined: "1974", region: "Africa" },
        { name: "Republic of TAJIKISTAN", flag: "https://flagpedia.net/data/flags/w580/tj.webp", joined: "1992", region: "Asia" },
        { name: "Republic of TURKIYE", flag: "https://flagpedia.net/data/flags/w580/tr.webp", joined: "1969", region: "Europe/Asia" },
        { name: "Turkmenistan", flag: "https://flagpedia.net/data/flags/w580/tm.webp", joined: "1992", region: "Asia" },
        { name: "Republic of CHAD", flag: "https://flagpedia.net/data/flags/w580/td.png", joined: "1969", region: "Africa" },
        { name: "Republic of TOGO", flag: "https://flagpedia.net/data/flags/w580/tg.webp", joined: "1997", region: "Africa" },
        { name: "Republic of TUNISIA", flag: "https://flagpedia.net/data/flags/w580/tn.webp", joined: "1969", region: "Africa" },
        { name: "People's Democratic Republic of ALGERIA", flag: "https://flagpedia.net/data/flags/w580/dz.webp", joined: "1969", region: "Africa" },
        { name: "Republic of DJIBOUTI", flag: "https://flagpedia.net/data/flags/w580/dj.webp", joined: "1978", region: "Africa" },
        { name: "Kingdom of SAUDI ARABIA", flag: "https://flagpedia.net/data/flags/w580/sa.webp", joined: "1969", region: "Middle East" },
        { name: "Republic of SENEGAL", flag: "https://flagpedia.net/data/flags/w580/sn.webp", joined: "1969", region: "Africa" },
        { name: "Republic of The SUDAN", flag: "https://flagpedia.net/data/flags/w580/sd.webp", joined: "1969", region: "Africa" },
        { name: "SYRIAN Arab Republic", flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Syria_%282025-%29.svg/1920px-Flag_of_Syria_%282025-%29.svg.png", joined: "1972", region: "Middle East" },
        { name: "Republic of SURINAME", flag: "https://flagpedia.net/data/flags/w580/sr.webp", joined: "1996", region: "South America" },
        { name: "Republic of SIERRA LEONE", flag: "https://flagpedia.net/data/flags/h80/sl.webp", joined: "1972", region: "Africa" },
        { name: "Federal Republic of SOMALIA", flag: "https://flagpedia.net/data/flags/h80/so.webp", joined: "1969", region: "Africa" },
        { name: "Republic of IRAQ", flag: "https://flagpedia.net/data/flags/h80/iq.webp", joined: "1975", region: "Middle East" },
        { name: "Sultanate of OMAN", flag: "https://flagpedia.net/data/flags/h80/om.webp", joined: "1972", region: "Middle East" },
        { name: "Republic of GABON", flag: "https://flagpedia.net/data/flags/h80/ga.webp", joined: "1974", region: "Africa" },
        { name: "Republic of The GAMBIA", flag: "https://flagpedia.net/data/flags/h80/gm.webp", joined: "1974", region: "Africa" },
        { name: "Cooperative Republic of GUYANA", flag: "https://flagpedia.net/data/flags/h80/gy.webp", joined: "1998", region: "South America" },
        { name: "Republic of GUINEA", flag: "https://flagpedia.net/data/flags/h80/gn.webp", joined: "1969", region: "Africa" },
        { name: "Republic of GUINEA-BISSAU", flag: "https://flagpedia.net/data/flags/h80/gw.webp", joined: "1974", region: "Africa" },
        { name: "State of PALESTINE", flag: "https://flagpedia.net/data/flags/h80/ps.webp", joined: "1969", region: "Middle East" },
        { name: "Union of The COMOROS", flag: "https://flagpedia.net/data/flags/h80/km.webp", joined: "1976", region: "Africa" },
        { name: "KYRGYZ Republic", flag: "https://flagpedia.net/data/flags/h80/kg.webp", joined: "1992", region: "Asia" },
        { name: "State of QATAR", flag: "https://flagpedia.net/data/flags/h80/qa.webp", joined: "1972", region: "Middle East" },
        { name: "Republic of KAZAKHSTAN", flag: "https://flagpedia.net/data/flags/h80/kz.webp", joined: "1995", region: "Asia" },
        { name: "Republic of CAMEROON", flag: "https://flagpedia.net/data/flags/h80/cm.webp", joined: "1974", region: "Africa" },
        { name: "Republic of COTE D'IVOIRE", flag: "https://flagpedia.net/data/flags/h80/ci.webp", joined: "2001", region: "Africa" },
        { name: "State of KUWAIT", flag: "https://flagpedia.net/data/flags/h80/kw.webp", joined: "1969", region: "Middle East" },
        { name: "Republic of LEBANON", flag: "https://flagpedia.net/data/flags/h80/lb.webp", joined: "1969", region: "Middle East" },
        { name: "Libya", flag: "https://flagpedia.net/data/flags/h80/ly.webp", joined: "1969", region: "Africa" },
        { name: "Republic of MALDIVES", flag: "https://flagpedia.net/data/flags/h80/mv.webp", joined: "1976", region: "Asia" },
        { name: "Republic of MALI", flag: "https://flagpedia.net/data/flags/h80/ml.webp", joined: "1969", region: "Africa" },
        { name: "MALAYSIA", flag: "https://flagpedia.net/data/flags/h80/my.webp", joined: "1969", region: "Asia" },
        { name: "Arab Republic of EGYPT", flag: "https://flagpedia.net/data/flags/h80/eg.webp", joined: "1969", region: "Africa" },
        { name: "Kingdom of MOROCCO", flag: "https://flagpedia.net/data/flags/h80/ma.webp", joined: "1969", region: "Africa" },
        { name: "Islamic Republic of MAURITANIA", flag: "https://flagpedia.net/data/flags/h80/mr.webp", joined: "1969", region: "Africa" },
        { name: "Republic of MOZAMBIQUE", flag: "https://flagpedia.net/data/flags/h80/mz.webp", joined: "1994", region: "Africa" },
        { name: "Republic of NIGER", flag: "https://flagpedia.net/data/flags/h80/ne.webp", joined: "1969", region: "Africa" },
        { name: "Federal Republic of NIGERIA", flag: "https://flagpedia.net/data/flags/h80/ng.webp", joined: "1986", region: "Africa" },
        { name: "Republic of YEMEN", flag: "https://flagpedia.net/data/flags/h80/ye.webp", joined: "1969", region: "Middle East" },
    ];

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get unique regions for filter
    const regions = ['All', ...new Set(members.map(m => m.region))];
    const [selectedRegion, setSelectedRegion] = useState('All');

    const finalFiltered = filteredMembers.filter(member =>
        selectedRegion === 'All' || member.region === selectedRegion
    );

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {language === 'ar' ? 'الدول الأعضاء' : 'Member States'}
                </h1>
                <div className="mt-2 h-1 w-12 rounded-full bg-[#1a4731]"></div>
                <p className="mt-3 text-sm text-gray-700">
                    {language === 'ar' 
                        ? 'قائمة الدول الأعضاء في منظمة التعاون الإسلامي' 
                        : `${members.length} member states of the Organization of Islamic Cooperation`}
                </p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        id="member-search"
                        name="search"
                        aria-label="search"
                        placeholder={language === 'ar' ? 'بحث عن دولة...' : 'Search member states...'}
                        className="w-full pl-10 pr-4 py-2.5 glass-input rounded-lg text-sm focus:outline-none"
                    />
                </div>
                <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    id="member-region"
                    name="region"
                    aria-label="region"
                    className="px-4 py-2.5 glass-input rounded-lg text-sm focus:outline-none sm:w-48"
                >
                    {regions.map(region => (
                        <option key={region} value={region}>
                            {region === 'All' ? (language === 'ar' ? 'جميع المناطق' : 'All Regions') : region}
                        </option>
                    ))}
                </select>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {finalFiltered.map((member, index) => (
                    <div
                        key={index}
                        className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
                    >
                        <div className="relative w-full aspect-[3/2] bg-gray-100">
                            <img
                                src={member.flag}
                                alt={member.name}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/300x200/1a4731/ffffff?text=OIC';
                                }}
                            />
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2 mb-2 group-hover:text-[#1a4731] transition-colors">
                                {member.name}
                            </h3>
                            <div className="mt-auto flex items-center gap-1 text-xs text-gray-700">
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                </svg>
                                <span>Member since {member.joined}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-700">
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{member.region}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No results */}
            {finalFiltered.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-700">
                        {language === 'ar' ? 'لا توجد دول تطابق البحث' : 'No member states match your search'}
                    </p>
                </div>
            )}

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-[#1a4731]">{members.length}</div>
                    <div className="text-sm text-gray-700">
                        {language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}
                    </div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{regions.length - 1}</div>
                    <div className="text-sm text-gray-700">
                        {language === 'ar' ? 'المناطق' : 'Regions'}
                    </div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {members.filter(m => m.joined === '1969').length}
                    </div>
                    <div className="text-sm text-gray-700">
                        {language === 'ar' ? 'الأعضاء المؤسسين' : 'Founding Members'}
                    </div>
                </div>
            </div>
        </div>
    );
};