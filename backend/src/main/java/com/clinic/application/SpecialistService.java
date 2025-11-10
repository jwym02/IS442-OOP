package com.clinic.application;

import com.clinic.api.common.dto.SpecialistResponse;
import com.clinic.domain.entity.Specialist;
import com.clinic.infrastructure.persistence.SpecialistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialistService {
    private final SpecialistRepository specialistRepository;

    public SpecialistService(SpecialistRepository specialistRepository) {
        this.specialistRepository = specialistRepository;
    }

    @Transactional(readOnly = true)
    public List<SpecialistResponse> listAll() {
        return specialistRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private SpecialistResponse toResponse(Specialist s) {
        SpecialistResponse r = new SpecialistResponse();
        r.setId(s.getId());
        r.setName(s.getName());
        r.setAddress(s.getAddress());
        r.setPhone(s.getPhone());
        // openTime/closeTime not present on entity in your snapshot -> leave null
        return r;
    }
}
