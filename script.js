// Navigation and View Management
function navigateTo(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
    }

    if (pageId === 'test-page') {
        updateProgressBar();
    }
}

function updateProgressBar() {
    const sliders = document.querySelectorAll('input[type="range"]');
    const total = sliders.length;
    // We consider "interacted" if the value is not at default (though they start at 5)
    // For simplicity, let's just track how many sliders exist vs how many are in view?
    // Actually, a simple progress is just fine. Let's just mock it or skip it if too complex.
    // Better: Progress = (current slider index in view / total) - but they are all on one page.
    // Let's just hide the progress bar if we keep them all on one page, or set it based on scroll.

    // For now, let's keep it static at 100% when on the page, or remove it.
    // User requested "paginas", but I kept the test on one page for now. 
    // I will remove the progress bar for now as it's less relevant in a single-page list.
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = '100%';
}

// Data Management
function saveData() {
    const data = {};
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        data[slider.id] = slider.value;
    });
    localStorage.setItem('lento_data', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('lento_data');
    if (savedData) {
        const data = JSON.parse(savedData);
        Object.keys(data).forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.value = data[id];
                const valueDisplay = document.getElementById(id + '-val');
                if (valueDisplay) {
                    valueDisplay.textContent = data[id];
                }
            }
        });
    }
}

function clearData() {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
        localStorage.removeItem('lento_data');
        location.reload();
    }
}

function restartEvaluation() {
    if (confirm('¿Querés volver a empezar? Los datos actuales se mantendrán hasta que los borres.')) {
        navigateTo('landing-page');
    }
}

// Logic Migration
function analyzeAndShowResults() {
    analyzeResults();
    navigateTo('results-page');
}

function analyzeResults() {
    const units = [
        { name: 'Pareja/Relación significativa', prefix: 'partner', area: 'Relaciones' },
        { name: 'Familia', prefix: 'family', area: 'Relaciones' },
        { name: 'Amistades', prefix: 'friendship', area: 'Relaciones' },
        { name: 'Salud física/Deporte', prefix: 'physical', area: 'Cuerpo, Mente y Espiritualidad' },
        { name: 'Salud mental/Mindfulness', prefix: 'mental', area: 'Cuerpo, Mente y Espiritualidad' },
        { name: 'Espiritualidad/Fe', prefix: 'spiritual', area: 'Cuerpo, Mente y Espiritualidad' },
        { name: 'Comunidad/Ciudadanía', prefix: 'community', area: 'Comunidad y Sociedad' },
        { name: 'Compromiso social', prefix: 'social', area: 'Comunidad y Sociedad' },
        { name: 'Trabajo/Carrera', prefix: 'job', area: 'Trabajo, Aprendizaje y Finanzas' },
        { name: 'Educación/Aprendizaje', prefix: 'education', area: 'Trabajo, Aprendizaje y Finanzas' },
        { name: 'Finanzas', prefix: 'finance', area: 'Trabajo, Aprendizaje y Finanzas' },
        { name: 'Hobbies/Intereses', prefix: 'hobbies', area: 'Intereses y Entretenimiento' },
        { name: 'Entretenimiento online', prefix: 'online', area: 'Intereses y Entretenimiento' },
        { name: 'Entretenimiento offline', prefix: 'offline', area: 'Intereses y Entretenimiento' },
        { name: 'Necesidades fisiológicas', prefix: 'physiological', area: 'Cuidado Personal' },
        { name: 'Actividades de la vida diaria', prefix: 'daily', area: 'Cuidado Personal' }
    ];

    const results = units.map(unit => {
        const importanceNode = document.getElementById(unit.prefix + '-importance');
        const satisfactionNode = document.getElementById(unit.prefix + '-satisfaction');

        if (!importanceNode || !satisfactionNode) return null;

        const importance = parseInt(importanceNode.value);
        const satisfaction = parseInt(satisfactionNode.value);
        const gap = importance - satisfaction;

        // Impacto ponderado: brecha × importancia²
        const weightedImpact = gap * (importance * importance);

        return {
            name: unit.name,
            area: unit.area,
            importance,
            satisfaction,
            gap,
            weightedImpact
        };
    }).filter(r => r !== null);

    // Calculate metrics
    const sumImportance = results.reduce((sum, r) => sum + r.importance, 0);
    const sumWeightedSatisfaction = results.reduce((sum, r) => sum + (r.importance * r.satisfaction), 0);
    const overallScore = (sumWeightedSatisfaction / (sumImportance || 1)).toFixed(2);

    results.forEach(item => {
        item.aporte = ((item.satisfaction * item.importance) / (sumImportance || 1)).toFixed(2);
        item.potencialMejora = (((10 - item.satisfaction) * item.importance) / (sumImportance || 1)).toFixed(2);
    });

    // Sort by Potencial Mejora descending
    results.sort((a, b) => parseFloat(b.potencialMejora) - parseFloat(a.potencialMejora));

    const topContributors = [...results].sort((a, b) => parseFloat(b.aporte) - parseFloat(a.aporte)).slice(0, 3);
    const topImprovementAreas = results.slice(0, 5);

    // Start building HTML
    let html = `
        <div class="insight-box hero-box">
            <div class="score-container">
                <div class="overall-score">${overallScore}/10</div>
                <div class="score-label">Tu Score de Vida</div>
            </div>
        </div>

        <div class="insight-box">
            <div class="insight-title">📊 Análisis Estratégico</div>
            <div class="insight-content">
                <p style="margin-bottom: 24px; line-height: 1.8;">
                    Tu situación actual indica que ${overallScore >= 7.5 ? 'tenés un balance sólido, facilitando el enfoque en optimizaciones sutiles' :
            overallScore >= 6 ? 'podés beneficiarte de ajustes en tus prioridades semanales' :
                overallScore >= 4.5 ? 'hay una brecha que está consumiendo tu energía innecesariamente' :
                    'requerís un replanteo estructural de tus actividades diarias'
        }.
                </p>
                <div class="summary-lists">
                    <div style="margin-bottom: 20px;">
                        <strong>Fortalezas (Sostener):</strong><br>
                        ${topContributors.map((item) => `${item.name} <span class="badge contribution">${item.aporte}</span>`).join(' • ')}
                    </div>
                    <div>
                        <strong>Prioridades (Mejorar):</strong><br>
                        ${topImprovementAreas.slice(0, 3).map((item) => `${item.name} <span class="badge improvement">${item.potencialMejora}</span>`).join(' • ')}
                    </div>
                </div>
            </div>
        </div>

        <div class="table-container-header" style="margin-top: 3rem; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.2rem; font-weight: 800;">Detalle por Área</h3>
            <button class="btn btn-secondary" id="toggleDetailTable" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 8px;">
                Ver Tabla Detallada
            </button>
        </div>
        
        <div class="table-wrapper hidden" id="detailTableWrapper">
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Área de Vida</th>
                        <th>Imp.</th>
                        <th>Aporte</th>
                        <th>Potencial</th>
                    </tr>
                </thead>
                <tbody>
    `;

    results.forEach((item) => {
        const areaClass = getAreaClass(item.area);
        const potencialColor = getPotencialColor(item.potencialMejora);

        html += `
            <tr>
                <td>
                    <div style="font-weight: 700;">${item.name}</div>
                    <span class="area-label ${areaClass}">${item.area}</span>
                </td>
                <td style="font-family: monospace; font-weight: 700;">${item.importance}</td>
                <td style="font-family: monospace;">${item.aporte}</td>
                <td style="font-family: monospace; font-weight: 700; color: ${potencialColor}">${item.potencialMejora}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <div class="insight-box" style="margin-top: 3rem;">
            <div class="insight-title">🎯 Plan de Acción Recomendado</div>
            <div class="action-grid">
    `;

    const actionIdeas = {
        'Espiritualidad/Fe': ['Práctica diaria de 10 min', 'Unirte a una comunidad'],
        'Educación/Aprendizaje': ['Inscribite en un programa clave', '30 min de lectura diaria'],
        'Salud mental/Mindfulness': ['Iniciar terapia', 'Journaling diario'],
        'Hobbies/Intereses': ['Bloquear 2h semanales', 'Empezar proyecto personal'],
        'Pareja/Relación significativa': ['Cita semanal sin pantallas', 'Charla de expectativas'],
        'Compromiso social': ['Acción mensual concreta', 'Voluntariado'],
        'Salud física/Deporte': ['Ejercicio 3x semana', 'Grupo de accountability'],
        'Necesidades fisiológicas': ['Rutina de sueño estable', 'Optimizar nutrición'],
        'Trabajo/Carrera': ['2 metas a 6 meses', 'Reunión de mentoría'],
        'Familia': ['Ritual de conexión semanal', 'Encuentro familiar'],
        'Amistades': ['Llamar a un amigo clave', 'Salida grupal regular'],
        'Finanzas': ['Revisión de presupuesto', 'Plan de inversión'],
        'Comunidad/Ciudadanía': ['Asociación vecinal', 'Proyecto local'],
        'Entretenimiento offline': ['Experiencia cultural mensual', 'Desconexión digital'],
        'Entretenimiento online': ['Límites en redes sociales', 'Contenido educativo'],
        'Actividades de la vida diaria': ['Delegar tareas', 'Optimizar procesos']
    };

    topImprovementAreas.slice(0, 3).forEach((item, index) => {
        const ideas = actionIdeas[item.name] || ['Plan de acción', 'Nueva rutina'];
        html += `
            <div class="action-card">
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.5rem;">PRIORIDAD #${index + 1}</div>
                <div style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem;">${item.name}</div>
                <ul style="padding-left: 1.25rem; font-size: 0.95rem; color: var(--text-muted);">
                    <li>${ideas[0]}</li>
                    <li>${ideas[1]}</li>
                </ul>
            </div>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;

    const resultContainer = document.getElementById('analysis-content');
    resultContainer.innerHTML = html;

    // Re-attach event listener for the toggle button
    const toggleBtn = document.getElementById('toggleDetailTable');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            const wrapper = document.getElementById('detailTableWrapper');
            const isHidden = wrapper.classList.contains('hidden');
            wrapper.classList.toggle('hidden');
            this.textContent = isHidden ? 'Ocultar Detalle' : 'Ver Tabla Detallada';
        });
    }
}

function getAreaClass(area) {
    const map = {
        'Relaciones': 'relationships',
        'Cuerpo, Mente y Espiritualidad': 'body',
        'Comunidad y Sociedad': 'community',
        'Trabajo, Aprendizaje y Finanzas': 'work',
        'Intereses y Entretenimiento': 'entertainment',
        'Cuidado Personal': 'personal'
    };
    return map[area] || '';
}

function getPotencialColor(val) {
    const fVal = parseFloat(val);
    if (fVal >= 4) return '#ef4444';
    if (fVal >= 2.5) return '#f59e0b';
    if (fVal >= 1) return '#10b981';
    return '#6b7280';
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.addEventListener('input', function () {
            const valueDisplay = document.getElementById(this.id + '-val');
            if (valueDisplay) {
                valueDisplay.textContent = this.value;
            }
            saveData();
        });
    });
});
