class PersonalProfile {
    constructor() {
        this.profileData = null;
        this.githubRepos = [];
        this.init();
    }

    async init() {
        await this.loadProfile();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.setupMobileMenu();
        this.animateSkillBars();
        this.loadGitHubRepos();
    }

    async loadProfile() {
        try {
            const response = await fetch('/api/profile');
            if (!response.ok) {
                throw new Error('Failed to load profile');
            }
            
            this.profileData = await response.json();
            this.renderProfile();
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showToast('Ошибка загрузки профиля', 'error');
        }
    }

    renderProfile() {
        if (!this.profileData) return;

        const profile = this.profileData;

        // Update hero section
        document.getElementById('heroName').textContent = `${profile.first_name} ${profile.last_name}`;
        document.getElementById('heroBio').textContent = profile.bio || 'Веб-разработчик';
        
        // Update about section
        document.getElementById('aboutBio').textContent = profile.bio || 'Информация о профиле будет загружена...';
        document.getElementById('contactEmail').textContent = profile.email;
        document.getElementById('contactPhone').textContent = profile.phone || 'Не указан';
        document.getElementById('contactLocation').textContent = profile.location || 'Местоположение не указано';

        // Update contact section
        document.getElementById('contactEmailSection').textContent = profile.email;
        document.getElementById('githubUsernameSection').textContent = profile.github_username || 'Не указан';
        
        // Update social links
        const githubLink = document.getElementById('githubLink');
        const linkedinLink = document.getElementById('linkedinLink');
        const websiteLink = document.getElementById('websiteLink');
        const githubProfileLink = document.getElementById('githubProfileLink');

        if (profile.github_username) {
            const githubUrl = `https://github.com/${profile.github_username}`;
            githubLink.href = githubUrl;
            githubProfileLink.href = githubUrl;
        }

        if (profile.linkedin_url) {
            linkedinLink.href = profile.linkedin_url;
        }

        if (profile.website_url) {
            websiteLink.href = profile.website_url;
        }

        // Update profile photo
        if (profile.photo_url) {
            document.getElementById('profilePhoto').src = profile.photo_url;
        }

        // Render experience
        this.renderExperience(profile.experience || []);
        
        // Render skills
        this.renderSkills(profile.skills || []);
        
        // Render projects
        this.renderProjects(profile.projects || []);

        // Populate form fields
        this.populateForm();
    }

    renderExperience(experience) {
        const timeline = document.getElementById('experienceTimeline');
        
        if (experience.length === 0) {
            timeline.innerHTML = '<p class="text-center">Опыт работы не указан</p>';
            return;
        }

        timeline.innerHTML = experience.map((exp, index) => `
            <div class="timeline-item fade-in" data-delay="${index * 200}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${this.formatDate(exp.start_date)} - ${exp.end_date ? this.formatDate(exp.end_date) : 'н.в.'}</div>
                    <h3 class="timeline-title">${exp.position}</h3>
                    <div class="timeline-company">${exp.company_name}</div>
                    <div class="timeline-description">${exp.description || ''}</div>
                    ${exp.technologies && exp.technologies.length > 0 ? `
                        <div class="project-tech">
                            ${exp.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.animateOnScroll();
    }

    renderSkills(skills) {
        const skillsGrid = document.getElementById('skillsGrid');
        
        if (skills.length === 0) {
            skillsGrid.innerHTML = '<p class="text-center">Навыки не указаны</p>';
            return;
        }

        const skillCategories = {
            'Programming': 'fas fa-code',
            'Frontend': 'fas fa-desktop',
            'Backend': 'fas fa-server',
            'Database': 'fas fa-database',
            'Tools': 'fas fa-tools',
            'Design': 'fas fa-palette'
        };

        skillsGrid.innerHTML = skills.map(skill => `
            <div class="skill-card fade-in" data-category="${skill.category || 'Other'}">
                <i class="${skillCategories[skill.category] || 'fas fa-star'}"></i>
                <h4>${skill.skill_name}</h4>
                <div class="skill-level">${skill.skill_level}%</div>
            </div>
        `).join('');

        this.animateOnScroll();
    }

    renderProjects(projects) {
        const projectsGrid = document.getElementById('projectsGrid');
        
        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p class="text-center">Проекты не добавлены</p>';
            return;
        }

        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card fade-in" data-category="web">
                <div class="project-image">
                    <i class="fas fa-code"></i>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${project.project_name}</h3>
                    <p class="project-description">${project.description || ''}</p>
                    ${project.technologies && project.technologies.length > 0 ? `
                        <div class="project-tech">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="project-links">
                        ${project.github_url ? `<a href="${project.github_url}" class="project-link" target="_blank">
                            <i class="fab fa-github"></i> GitHub
                        </a>` : ''}
                        ${project.demo_url ? `<a href="${project.demo_url}" class="project-link" target="_blank">
                            <i class="fas fa-external-link-alt"></i> Демо
                        </a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        this.animateOnScroll();
        this.setupProjectFilters();
    }

    async loadGitHubRepos() {
        if (!this.profileData?.github_username) return;

        try {
            const response = await fetch(`/api/github/repos/${this.profileData.github_username}`);
            if (!response.ok) {
                throw new Error('Failed to load GitHub repos');
            }

            this.githubRepos = await response.json();
            this.renderGitHubRepos();
        } catch (error) {
            console.error('Error loading GitHub repos:', error);
            document.getElementById('githubRepos').innerHTML = '<p class="text-center">Не удалось загрузить репозитории</p>';
        }
    }

    renderGitHubRepos() {
        const reposContainer = document.getElementById('githubRepos');
        
        if (this.githubRepos.length === 0) {
            reposContainer.innerHTML = '<p class="text-center">Репозитории не найдены</p>';
            return;
        }

        reposContainer.innerHTML = this.githubRepos.map(repo => `
            <div class="github-repo fade-in">
                <div class="repo-header">
                    <a href="${repo.html_url}" class="repo-name" target="_blank">
                        <i class="fab fa-github"></i> ${repo.name}
                    </a>
                    ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ''}
                </div>
                ${repo.description ? `<p class="repo-description">${repo.description}</p>` : ''}
                <div class="repo-stats">
                    <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                    <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatRelativeDate(repo.updated_at)}</span>
                </div>
            </div>
        `).join('');

        this.animateOnScroll();
    }

    populateForm() {
        const profile = this.profileData;
        if (!profile) return;

        document.getElementById('firstName').value = profile.first_name || '';
        document.getElementById('lastName').value = profile.last_name || '';
        document.getElementById('middleName').value = profile.middle_name || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('location').value = profile.location || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('githubUsername').value = profile.github_username || '';
        document.getElementById('linkedinUrl').value = profile.linkedin_url || '';
        document.getElementById('websiteUrl').value = profile.website_url || '';
    }

    setupEventListeners() {
        // Edit profile modal
        const editBtn = document.getElementById('editBtn');
        const modal = document.getElementById('editModal');
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const form = document.getElementById('profileForm');

        editBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeModal.addEventListener('click', () => {
            this.closeModal();
        });

        cancelEdit.addEventListener('click', () => {
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProfile();
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Back to top button
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            backToTop.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Profile photo upload
        const profileImage = document.querySelector('.profile-image-container');
        profileImage.addEventListener('click', () => {
            // In a real application, you would implement file upload
            this.showToast('Функция загрузки фото будет реализована', 'info');
        });
    }

    closeModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async updateProfile() {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            middle_name: formData.get('middle_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            location: formData.get('location'),
            bio: formData.get('bio'),
            github_username: formData.get('github_username'),
            linkedin_url: formData.get('linkedin_url'),
            website_url: formData.get('website_url')
        };

        try {
            this.showToast('Сохранение...', 'info');
            
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            this.showToast('Профиль успешно обновлен!', 'success');
            this.closeModal();
            await this.loadProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Ошибка при обновлении профиля', 'error');
        }
    }

    setupMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    setupProjectFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filter = btn.dataset.filter;

                projectCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                        card.classList.add('fade-in');
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    setupScrollAnimations() {
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        });

        // Animate elements on scroll
        this.animateOnScroll();
    }

    animateOnScroll() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
            observer.observe(el);
        });
    }

    animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        const animateBars = () => {
            skillBars.forEach(bar => {
                const percentage = bar.dataset.percentage;
                if (percentage) {
                    setTimeout(() => {
                        bar.style.width = percentage + '%';
                    }, 500);
                }
            });
        };

        // Start animation when skills section is visible
        const skillsSection = document.querySelector('.skills');
        if (skillsSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateBars();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(skillsSection);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const messageEl = toast.querySelector('.toast-message');
        const iconEl = toast.querySelector('.toast-icon');

        // Set message
        messageEl.textContent = message;

        // Set type and icon
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        iconEl.className = `toast-icon ${icons[type] || icons.info}`;

        // Show toast
        toast.classList.add('active');

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long'
        });
    }

    formatRelativeDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} нед. назад`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} мес. назад`;
        return `${Math.ceil(diffDays / 365)} г. назад`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PersonalProfile();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}